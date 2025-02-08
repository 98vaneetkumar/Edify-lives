exports.forgotPassword = function (resetUrl) {
  return `
    <div style="max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; font-family: Arial, sans-serif; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
  <h2 style="color: #333;">🔐 Your OTP Code</h2>
  <p style="font-size: 18px; color: #555;">Use the OTP below to verify your identity:</p>
  <div style="font-size: 24px; font-weight: bold; color: #4CAF50; background: #fff; display: inline-block; padding: 15px 30px; margin: 20px 0; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);">
    {{OTP}}
  </div>
  <p style="font-size: 14px; color: #777;">This OTP is valid for only 1 hours.</p>
  <p style="font-size: 14px; color: #777;">If you didn't request this, please ignore this email.</p>
</div>`;
};
