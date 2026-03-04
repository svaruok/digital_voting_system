const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {

  const { email, password } = req.body;

  try {

    const admin = await Admin.findOne({ email });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Admin Login Successful",
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
