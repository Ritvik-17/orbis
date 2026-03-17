// import prisma from "../prisma/client.js";

// export const createNotification = async ({
//   userId,
//   title,
//   message,
//   type,
// }) => {
//   try {
//     await prisma.notification.create({
//       data: {
//         userId,
//         title,
//         message,
//         type,
//       },
//     });
//   } catch (error) {
//     console.error("Notification creation error:", error);
//   }
// };