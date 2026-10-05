import mongoose from "mongoose";
import { seedAdmin } from "./seedAdmin";

let isConnected = false

export async function connectDb() {
    if (isConnected) return;
    try {
        const uri = process.env.URI;
        if (!uri) throw new Error('URI environment variable is not set');
        await mongoose.connect(uri)
        seedAdmin()
        console.log('MongoDb Connected')
    } catch (error) {
        console.log(error)
    }
}

//  let form = new adminModel(adminDetails);
//   form
//     .save()
//     .then((data) => {
//       let schoolForm = new schoolModel(schoolDetails);
//       schoolForm.save(schoolDetails).then((schoolData) => {
//         console.log("School registered successfully", schoolData);
//         res.status(200).json({
//           message: "School registered successfully",
//           data: { schoolData, data },
//         });
//       });
//       console.log("Admin registered successfully", data);
//     })
//     .catch((err) => {
//       console.log("Error in registering admin", err);
//       res.status(500).json({
//         message: "Error in registering admin",
//         error: err,
//       });
//     });
// };
