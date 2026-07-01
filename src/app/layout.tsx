import CustomCursor from "../components/CustomCursor";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Adding cursor-none hides the default computer mouse arrow */}
      <body className="bg-[#050505] cursor-none overflow-x-hidden">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
