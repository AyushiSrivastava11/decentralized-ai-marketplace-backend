// utils/invoice.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (order: any): Promise<string> => {
  const doc = new PDFDocument();
  const fileName = `invoice_${order.id}.pdf`;
  const invoiceDir = path.join(__dirname, "..", "invoices");

  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

  const filePath = path.join(invoiceDir, fileName);
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(20).text("AIPLAXE Invoice", { align: "center" });
  doc.moveDown();
  doc.text(`User ID: ${order.userId}`);
  doc.text(`Agent: ${order.aiWorkerId}`);
  doc.text(`Runs Purchased: ${order.cycles}`);
  doc.text(`Total: ₹${order.totalAmount}`);
  doc.text(`Razorpay Order ID: ${order.razorpayOrderId}`);
  doc.end();

  return new Promise<string>((resolve) => {
    stream.on("finish", () => resolve(fileName));
  });
};
