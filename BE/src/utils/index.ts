import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
dotenv.config();

export const isStrongPassword = (password: string): boolean => {
  const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
  //Có ít nhất 8 ký tự
  //Có ít nhất 1 chữ số
  //Có ít nhất 1 chữ cái thường
  //Có ít nhất 1 chữ cái in hoa
  return strongPasswordRegex.test(password);
};

export const isValidUserName = (username: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(username); //Có ít nhất 1 chữ cái in hoa
  const hasLowerCase = /[a-z]/.test(username); //Có ít nhất 1 chữ cái thường
  const hasNumbers = /\d/.test(username); //Có ít nhất 1 chữ số

  return hasUpperCase && hasLowerCase && hasNumbers;
};

export const signToken = async (payload: {
  _id: Types.ObjectId;
  email: string;
  username: string;
  role: string;
}) => {
  const token = jwt.sign(payload, process.env.SECRET_KEY as string);
  return token;
};

export const replaceName = (str: string) => {
  return str
    .normalize("NFD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ /g, "-")
    .replace(/[:!@#$%^&*()?;/]/g, "");
};

export const randomText = (num: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for (let index = 0; index < characters.length; index++) {
    if (text.length <= (num ? num : 10)) {
      const str = characters[Math.floor(Math.random() * characters.length)];
      text += str;
    }
  }
  return text;
};

