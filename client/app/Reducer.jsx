import { combineReducers } from "redux";
import * as Action from "./Action";

const demo = (state = 0, action) => {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    default:
      return state;
  }
};

const loginStatus = (state = { isLoggedIn: false, token: "" }, action) => {
  switch (action.type) {
    case "login":
      state.isLoggedIn = true;
      state.token = action.token;
      return state;
    case "logout":
      return state;
    default:
      return state;
  }
};

const reducer = combineReducers({ demo, loginStatus });
export default reducer;
