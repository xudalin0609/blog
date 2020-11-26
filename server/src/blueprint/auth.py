from flask import Blueprint, request, current_app, g
from flask.json import jsonify

from blueprint.errors import api_abort, invalid_token, token_missing
from itsdangerous import BadSignature, SignatureExpired, TimedJSONWebSignatureSerializer as Serializer
from functools import wraps

from models import User

auth_bp = Blueprint("auth", __name__)

def generate_token(user):
    expiration = 3600
    s = Serializer(current_app.config['SECRET_KEY'], expires_in=expiration)
    token = s.dumps({'id': user.id}).decode('ascii')
    return token, expiration

def get_token():
    if 'Authorization' in request.headers:
        try:
            token_type, token = request.headers['Authorization'].split(None, 1)
        except ValueError:
            token_type = token = None
    else:
        token_type = token = None
    
    return token_type, token

def validate_token(token):
    s = Serializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token)
    except (BadSignature, SignatureExpired):
        return False
    
    user = User.query.get(data['id'])
    if user is None:
        return False
    g.current_user = user
    return True

@auth_bp.route("/oauth/token", methods=["POST"])
def auth_token_api():
    grant_type = request.form.get('grant_type')
    username = request.form.get('username')
    password = request.form.get('password')
    if grant_type is None or grant_type.lower() != 'password':
        return api_abort(code=400, message="无效的密码格式")

    user = User.query.filter_by(username=username).first()
    if user is None or not user.validate_password(password):
        return api_abort(code=400, message='用户名或密码错误')
    token, expiration = generate_token(user)
    response = jsonify({
        'access_token': token,
        'token_type': 'Bearer',
        'expires_in': expiration
    })
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'nocache'
    return response

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token_type, token = get_token()

        if request.method != 'OPTIONS':
            if token_type is None or token_type.lower() != 'bearer':
                return api_abort(400, 'token类型必须为bearer')
            if token is None:
                return token_missing()
            if not validate_token(token):
                return invalid_token()
        return f(*args, **kwargs)
    return decorated