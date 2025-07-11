import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateForSaving = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SECRET_KEY = process.env.ENCRYPTION_KEY || "your-secret-key";

export const encryptString = (str: string): string => {
  return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
};

export const decryptString = (encryptedStr: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
