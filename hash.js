import bcrypt from "bcryptjs";

const password = "JalimShikder?116"; // Your desired password
bcrypt.hash(password, 10).then(hash => {
  console.log("Hashed password:");
  console.log(hash);
  process.exit();
});
