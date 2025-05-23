const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Changed from bcryptjs to match User model
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Load environment variables with correct path resolution
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log('MongoDB URI:', process.env.MONGO_URI ? 'Found (value hidden)' : 'Not found');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/project-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected for setup'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Set strictQuery to suppress the warning
mongoose.set('strictQuery', false);

// Admin user details
const adminUser = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin'
};

// Student user details (for testing)
// const studentUser = {
//   username: 'student',
//   rollNo: 'S12345',
//   password: 'student123',
//   role: 'student'
// };
const studentUser= [
  {
    username: "Ritesh Singh",
    rollNo: "220103016",
    password: "abc@3016",
    role: "student",
  },
  {
    username: "Shashwat Kumar",
    rollNo: "220103040",
    password: "abc@3040",
    role: "student",
  },
  {
    username: "V Venkatesh",
    rollNo: "220101059",
    password: "abc@1059",
    role: "student",
  }
 
  // Add more students here
];

// Function to create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: adminUser.username });
    
    if (!existingAdmin) {
      // Create admin user
      const newAdmin = new User({
        username: adminUser.username,
        email: adminUser.email,
        password: adminUser.password, // Hashing happens in the pre-save hook
        role: adminUser.role
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
};

// Function to create student user
const createStudentUser = async () => {
  for (const studentData of studentUser) {
    try {
      const existingStudent = await User.findOne({
        rollNo: studentData.rollNo,
      });
      if (!existingStudent) {
        const newStudent = new User(studentData); // Pass the whole object
        await newStudent.save(); // This triggers the pre-save hook for hashing
        console.log(
          `Student user ${studentData.username} created successfully`
        );
      } else {
        console.log(
          `Student user ${studentData.username} (Roll: ${studentData.rollNo}) already exists`
        );
      }
    } catch (err) {
      console.error(
        `Error creating student user ${studentData.username}:`,
        err
      );
      // Decide if you want to stop or continue on error
    }
  }
};

// Function to create required directories
const createDirectories = () => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created');
    } else {
      console.log('Uploads directory already exists');
    }
    
    // Create project files directory
    const projectFilesDir = path.resolve(uploadsDir, 'projects');
    if (!fs.existsSync(projectFilesDir)) {
      fs.mkdirSync(projectFilesDir, { recursive: true });
      console.log('Project files directory created');
    } else {
      console.log('Project files directory already exists');
    }
  } catch (err) {
    console.error('Error creating directories:', err);
  }
};

// Run setup
const runSetup = async () => {
  try {
    // await createAdminUser();
    await createStudentUser();
    // createDirectories();
    
    console.log('Setup completed successfully');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
};

runSetup();