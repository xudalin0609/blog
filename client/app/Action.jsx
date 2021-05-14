export const increment = () => {
  return {
    type: "increment",
  };
};

export const decrement = () => {
  return {
    type: "decrement",
  };
};

export const login = (token) => {
  return {
    type: "login",
    token: token,
  };
};

export const logout = () => {
  return {
    type: "logout",
  };
};
