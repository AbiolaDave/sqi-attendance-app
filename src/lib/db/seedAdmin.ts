import { User } from "@/models/User";

export const seedAdmin = async () => {
  const adminDetails = {
    full_name: "Johnny Cash",
    email: "johnny@gmail.com",
    phone: "08012345678",
    role: "super_admin",
    password: "Admin123",
  };

  const savedAdmin = await User.findOne({ email: adminDetails.email });

  if (savedAdmin) {
    return;
  }

  let form = await new User(adminDetails);
  form
    .save()
    .then(() => {
      console.log("User registered successfully");
    })
    .catch((err: Error) => {
      console.log("Error in registering admin", err);
    });
};
