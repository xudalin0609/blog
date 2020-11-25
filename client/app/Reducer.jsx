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

const isLoggedIn = (state = false, action) => {
  switch (action.type) {
    case "login":
      state = true;
      return state;
    case "logout":
      state = false;
      return state;
    default:
      return state;
  }
};

const reducer = combineReducers({ demo, isLoggedIn });
export default reducer;
