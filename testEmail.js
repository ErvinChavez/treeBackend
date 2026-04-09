// testEmail.js
const sendEmail = require("./src/utils/email");

async function test() {
  await sendEmail(
    "ervinchavez31@gmail.com", // replace with your email
    "Test Email from Chavez Tree Service",
    "This is a test email to make sure your email setup works!"
  )
    .then(() => console.log("Done"))
    .catch(err => console.error(err));;
}

test();