import bcrypt from "bcryptjs";

// This is the EXACT password you are trying to use in the login form
const passwordToHash = "JalimShikder!!??116"; 

const generate = async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordToHash, salt);
    console.log("---------------------------------------------------");
    console.log("PASTE THIS HASH INTO YOUR DB FOR 'jamil116':");
    console.log(hash);
    console.log("---------------------------------------------------");
};

generate();