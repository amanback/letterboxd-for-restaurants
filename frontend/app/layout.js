import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata = {
  title: "FoodBlog - Social Food Blogging Platform",
  description: "Share your dining experiences, discover restaurants, and get personalized recommendations from your food community.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
