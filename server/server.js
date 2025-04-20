// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client"))); // Serve frontend
app.use("/invoices", express.static(path.join(__dirname, "invoices"))); // Serve PDF files

// API endpoint for invoice generation
app.post("/api/generate", (req, res) => {
  const { senderName, senderAddress, senderEmail, senderPhone, senderVAT, 
          clientName, clientAddress, clientVAT, items, taxRate, dueDate } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided." });
  }

  const invoicesDir = path.join(__dirname, "invoices");
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }

  const timestamp = Date.now();
  const fileName = `INV-${timestamp}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(25).text('INVOICE', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Invoice Number: INV-${timestamp}`);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Due Date: ${dueDate}`).moveDown();

  // Sender
  doc.fontSize(14).text('Sender:', { underline: true });
  doc.fontSize(12).text(senderName)
     .text(senderAddress)
     .text(`Email: ${senderEmail}`)
     .text(`Phone: ${senderPhone}`);
  if (senderVAT) doc.text(`VAT ID: ${senderVAT}`);
  doc.moveDown();

  // Client
  doc.fontSize(14).text('Bill To:', { underline: true });
  doc.fontSize(12).text(clientName)
     .text(clientAddress);
  if (clientVAT) doc.text(`VAT ID: ${clientVAT}`);
  doc.moveDown();

  // Items
  doc.fontSize(14).text('Items:', { underline: true });

  let subtotal = 0;
  items.forEach(item => {
    const itemTotal = item.qty * item.unitPrice;
    subtotal += itemTotal;

    doc.fontSize(12).text(`${item.description}`);
    doc.text(`Qty: ${item.qty}, Unit Price: $${item.unitPrice.toFixed(2)}, Total: $${itemTotal.toFixed(2)}`);
    doc.moveDown(0.5);
  });

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  doc.moveDown();
  doc.fontSize(12).text(`Subtotal: $${subtotal.toFixed(2)}`);
  doc.text(`Tax (${taxRate}%): $${taxAmount.toFixed(2)}`);
  doc.fontSize(14).text(`Grand Total: $${grandTotal.toFixed(2)}`);
  doc.moveDown();

  // Payment Info
  doc.fontSize(14).text('Payment Information:', { underline: true });
  doc.fontSize(12)
     .text('Bank Name: [Your Bank Name]')
     .text('IBAN: [Your IBAN]')
     .text('SWIFT/BIC: [Your SWIFT/BIC]')
     .text('PayPal: [Your PayPal Email]')
     .text(`Payment terms: Payment due within ${dueDate} days of invoice date.`)
     .moveDown();

  doc.fontSize(12).text('Thank you for your business!', { align: 'center' });
  doc.text('For more information, visit [Your Company Website]', { align: 'center' });
  doc.end();

  stream.on('finish', () => {
    res.json({
      message: `Invoice for ${clientName} created successfully.`,
      filePath: `/invoices/${fileName}`
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});