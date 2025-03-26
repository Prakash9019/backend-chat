const mongoose = require("mongoose");
const {Schema}= mongoose;
const ProfileSchema = new Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'             // works as foriegn key for the user.js file
},
username:String,
  firstName: String,
  lastName: String,
  city: String,
  headline: String,
  portfolioLink: String,
  linkedinLink: String,
  github:String,
  twitter:String,
  achievement :String,
  skills: [String],
  disciplines :  [String],
  avatar: {
    type: String, // URL or Base64 string
    required: false,
    default: "", // Default avatar
  },
  skippedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: "Profile", default: [] },
    connections: { type: [mongoose.Schema.Types.ObjectId], ref: "Profile", default: [] }, // Added this field
    markedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: "Profile", default: [] },
  completed: Boolean,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
   
}, { timestamps: true });

module.exports = mongoose.model("Profile", ProfileSchema);
