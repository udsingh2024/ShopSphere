const PDFDocument = require('pdfkit');

/**
 * Generate a PDF invoice as an in-memory buffer.
 */
const generateInvoicePDF = (order, invoiceNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // 1. Store Brand Header
      doc
        .fillColor('#6366f1')
        .fontSize(24)
        .text('SHOPSPHERE', 50, 50, { font: 'Helvetica-Bold' })
        .fillColor('#333333')
        .fontSize(10)
        .text('AI-Powered Modern E-Commerce Platform', 50, 80)
        .text('123 Enterprise Suite, Tech Park, Bangalore', 50, 95)
        .text('GSTIN: 29AAAAA0000A1Z5', 50, 110);

      // Invoice metadata (Right aligned)
      doc
        .fontSize(16)
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .text(`Invoice No: ${invoiceNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' })
        .text(`Order ID: ${order._id.toString().substring(18)}`, 400, 105, { align: 'right' })
        .text(`Payment: ${order.paymentInfo.method.toUpperCase()}`, 400, 120, { align: 'right' });

      // Horizontal separator line
      doc.moveTo(50, 145).lineTo(550, 145).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // 2. Billing details
      const userObj = typeof order.user === 'object' ? order.user : { name: 'Customer', email: 'N/A' };
      doc
        .fontSize(12)
        .text('Bill To:', 50, 165, { font: 'Helvetica-Bold' })
        .fontSize(10)
        .text(userObj.name, 50, 185, { font: 'Helvetica' })
        .text(userObj.email, 50, 200)
        .text(`${order.shippingAddress.street}`, 50, 215)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 50, 230)
        .text(`${order.shippingAddress.country}`, 50, 245);

      // 3. Product Listing Table
      let tableTop = 280;
      doc
        .fontSize(10)
        .text('Product Details', 50, tableTop, { font: 'Helvetica-Bold' })
        .text('Qty', 350, tableTop, { align: 'center', font: 'Helvetica-Bold' })
        .text('Price', 420, tableTop, { align: 'right', font: 'Helvetica-Bold' })
        .text('Amount', 490, tableTop, { align: 'right', font: 'Helvetica-Bold' });

      // Table Header Underline
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#333333').lineWidth(1).stroke();

      let rowY = tableTop + 25;
      order.items.forEach((item) => {
        const prodTitle = item.product?.title || 'ShopSphere Product';
        const qty = item.quantity;
        const price = item.priceAtPurchase;
        const amount = price * qty;

        doc
          .font('Helvetica')
          .fontSize(9)
          .text(prodTitle, 50, rowY, { width: 280, lineBreak: false })
          .text(qty.toString(), 350, rowY, { align: 'center' })
          .text(`$${price.toFixed(2)}`, 420, rowY, { align: 'right' })
          .text(`$${amount.toFixed(2)}`, 490, rowY, { align: 'right' });

        rowY += 20;
      });

      // Table Footer separator
      doc.moveTo(50, rowY + 5).lineTo(550, rowY + 5).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // 4. Financial Calculations Summary (Right aligned side)
      let summaryY = rowY + 15;
      const subtotal = order.financials.subtotal;
      const discount = subtotal - (order.financials.total - order.financials.shippingFee - order.financials.tax); // calculate discount applied if any
      const shipping = order.financials.shippingFee;
      const tax = order.financials.tax;
      const grandTotal = order.financials.total;

      doc
        .fontSize(10)
        .text('Subtotal:', 350, summaryY, { align: 'right' })
        .text(`$${subtotal.toFixed(2)}`, 490, summaryY, { align: 'right' });

      if (discount > 0) {
        summaryY += 15;
        doc
          .fillColor('#ef4444')
          .text('Discount:', 350, summaryY, { align: 'right' })
          .text(`-$${discount.toFixed(2)}`, 490, summaryY, { align: 'right' })
          .fillColor('#333333');
      }

      summaryY += 15;
      doc
        .text('Shipping:', 350, summaryY, { align: 'right' })
        .text(`$${shipping.toFixed(2)}`, 490, summaryY, { align: 'right' });

      summaryY += 15;
      doc
        .text('Estimated GST (8%):', 350, summaryY, { align: 'right' })
        .text(`$${tax.toFixed(2)}`, 490, summaryY, { align: 'right' });

      // Grand Total Highlight box
      summaryY += 20;
      doc.rect(340, summaryY - 5, 210, 25).fill('#6366f1');
      doc
        .fillColor('#ffffff')
        .text('Grand Total:', 350, summaryY, { align: 'right', font: 'Helvetica-Bold' })
        .text(`$${grandTotal.toFixed(2)}`, 490, summaryY, { align: 'right', font: 'Helvetica-Bold' });

      // Footer Terms
      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .text('Thank you for shopping with ShopSphere!', 50, 720, { align: 'center' })
        .text('This is a computer-generated invoice and requires no physical signature.', 50, 735, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
