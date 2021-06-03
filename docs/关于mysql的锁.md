测试原因：在 mysql 中更新字段类型的时候，发生了 metadata lock，但是`show processlist`没有发现其他的持有锁的任务正在执行。最后，在阿里云的后台杀掉了一个无效连接，释放了该锁。

猜测：由于使用 sqlalchemy 的 session 过程中，任务异常停止，导致 sqlalchemy 没有释放连接导致该情况的产生。


1. 测试 1
   创建一个 session,并挂起任务，同时修改数据库结构

```python
from cases.extensions import Session

session = Session()

def test_case():
    time.sleep(100)
    session.close()

if __name__ == "__main__":
    test_case()
```

测试结果，在 session 期间可以正常修改表结构，没有产生 metadata lock，创建 session 并没有产生一个持有 metalock 的连接。

2. 测试 2

```python
session = Session()

def test_case():
    while True:
        stmt = test_ent.update().where(test_ent.columns.id==1).values(c_a="test1")
        time.sleep(100)
        session.close()

```

测试结果，在 session 期间可以正常修改表结构，没有产生 metadata lock，创建 session 并没有产生一个持有 metalock 的连接。

3. 测试 3

```python
def test_case3():
    for i in range(3):
        stmt = test_ent.update().where(test_ent.columns.id==1).values(c_a=str(i))
        session.execute(stmt)
        time.sleep(100)
    session.commit()
```
测试结果，产生了一个metalock阻止了期间进行的表结构修改（ddl类型操作）。

4. 测试 4

那么如果是dml类型的操作会产生metalock么？
```python
def test_case4():
    for i in range(3):
        stmt = test_ent.select().where(test_ent.columns.id==1)
        session.execute(stmt)
        time.sleep(20)
    session.commit()
```
测试结果，仍然产生了一个metalock。

matalock是什么？又为了解决什么问题呢？

- MDL出现的初衷就是为了保护一个处于事务中的表的结构不被修改。

- 这里提到的事务包括两类，显式事务和AC-NL-RO（auto-commit non-locking read-only）事务。显式事务包括两类：1. 关闭AutoCommit下的操作，2. 以begin或start transaction开始的操作。AC-NL-RO可理解为AutoCommit开启下的select操作。

- MDL是事务级别的，只有在事务结束后才会释放。在此之前，其实也有类似的保护机制，只不过是语句级别的。

到具体问题上主要是两类，不可重复读和主从复制问题。
不可重复读的例子如下，当第一次产生ddl操作但是没有执行commit，然后依次执行select、commit、select就会发现两次读取的结果不一样。（这也是上面case4中metalock产生的原因）
```sql
session1> begin;
Query OK, 0 rows affected (0.00 sec)
session1> select * from t1;
+------+------+
| id  | name |
+------+------+
|    1 | a    |
|    2 | b    |
+------+------+
2 rows in set (0.00 sec)
session2> alter table t1 add c1 int;
Query OK, 2 rows affected (0.02 sec)
Records: 2  Duplicates: 0  Warnings: 0
session1> select * from t1;
Empty set (0.00 sec)
session1> commit;
Query OK, 0 rows affected (0.00 sec)
session1> select * from t1;
+------+------+------+
| id  | name | c1  |
+------+------+------+
|    1 | a    | NULL |
|    2 | b    | NULL |
+------+------+------+
2 rows in set (0.00 sec)
```

接下来看主从复制的情况
```sql
session1> create table t1(id int,name varchar(10)) engine=innodb;
Query OK, 0 rows affected (0.00 sec)
session1> begin;
Query OK, 0 rows affected (0.00 sec)
session1> insert into t1 values(1,'a');
Query OK, 1 row affected (0.00 sec)
session2> truncate table t1;
Query OK, 0 rows affected (0.46 sec)
session1> commit;
Query OK, 0 rows affected (0.35 sec)
session1> select * from t1;
Empty set (0.00 sec)
```
此时从库的结果为
```
session1> select * from t1;
+------+------+------+
| id   | name | c1   |
+------+------+------+
|    1 | a    | NULL |
+------+------+------+
1 row in set (0.00 sec)
```

查看binlog,可以看到truncat操作在前，insert操作在后
```log
# at 7140
#180714 19:32:14 server id 1  end_log_pos 7261    Query    thread_id=31    exec_time=0    error_code=0
SET TIMESTAMP=1531567934/*!*/;
create table t1(id int,name varchar(10)) engine=innodb
/*!*/;
# at 7261
#180714 19:32:30 server id 1  end_log_pos 7333    Query    thread_id=32    exec_time=0    error_code=0
SET TIMESTAMP=1531567950/*!*/;
BEGIN
/*!*/;
# at 7333
#180714 19:32:30 server id 1  end_log_pos 7417    Query    thread_id=32    exec_time=0    error_code=0
SET TIMESTAMP=1531567950/*!*/;
truncate table t1
/*!*/;
# at 7417
#180714 19:32:30 server id 1  end_log_pos 7444    Xid = 422
COMMIT/*!*/;
# at 7444
#180714 19:32:34 server id 1  end_log_pos 7516    Query    thread_id=31    exec_time=0    error_code=0
SET TIMESTAMP=1531567954/*!*/;
BEGIN
/*!*/;
# at 7516
#180714 19:32:24 server id 1  end_log_pos 7611    Query    thread_id=31    exec_time=0    error_code=0
SET TIMESTAMP=1531567944/*!*/;
insert into t1 values(1,'a')
/*!*/;
# at 7611
#180714 19:32:34 server id 1  end_log_pos 7638    Xid = 421
COMMIT/*!*/;
```

至此便不难理解在这次问题中出现的情况了，由于后台有一个事务一直没有进行commit、rollback等操作，使得metalock一直存在，以至于不能进行ddl操作

参考文章

https://www.cnblogs.com/chenpingzhao/p/9642732.html

https://yq.aliyun.com/articles/638450