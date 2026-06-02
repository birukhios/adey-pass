"use client";

import QRCodeLib from "qrcode";

type TicketReceiptDownloadProps = {
  eventName: string;
  guestName: string;
  phone: string;
  ticketId: string;
  accessType: string;
  organization?: string | null;
  status: string;
  source: string;
};

export function TicketReceiptDownload({ eventName, guestName, phone, ticketId, accessType, organization, status, source }: TicketReceiptDownloadProps) {
  async function downloadReceipt() {
    const qrDataUrl = await QRCodeLib.toDataURL(JSON.stringify({ ticketId }), {
      margin: 2,
      color: { dark: "#0B1229", light: "#FFFFFF" },
      width: 420,
    });

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F5F7FB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#071B3D";
    roundRect(ctx, 52, 52, 796, 240, 36);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 44px Arial";
    ctx.fillText("Stadium Management System", 92, 132);
    ctx.font = "700 24px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("Walk-in access receipt", 92, 174);

    ctx.fillStyle = "#3B63F4";
    roundRect(ctx, 92, 214, 220, 48, 24);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 22px Arial";
    ctx.fillText(source.replaceAll("_", " "), 124, 246);

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 52, 324, 796, 760, 30);
    ctx.fill();
    ctx.strokeStyle = "#E5EAF3";
    ctx.lineWidth = 2;
    roundRect(ctx, 52, 324, 796, 760, 30);
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = "800 22px Arial";
    ctx.fillText(eventName.toUpperCase(), 92, 390);
    ctx.fillStyle = "#0F172A";
    ctx.font = "800 54px Arial";
    wrapText(ctx, guestName, 92, 462, 710, 62);

    const rows = [
      ["Ticket ID", ticketId],
      ["Access", accessType],
      ["Organization", organization || "Walk-in guest"],
      ["Phone", phone],
      ["Status", status],
      ["Issued", new Date().toLocaleString()],
    ];

    let y = 590;
    for (const [label, value] of rows) {
      ctx.fillStyle = "#64748B";
      ctx.font = "700 22px Arial";
      ctx.fillText(label, 92, y);
      ctx.fillStyle = "#0F172A";
      ctx.font = "800 26px Arial";
      ctx.fillText(value, 320, y);
      y += 54;
    }

    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await new Promise((resolve) => {
      qrImage.onload = resolve;
    });
    ctx.fillStyle = "#F8FAFC";
    roundRect(ctx, 292, 820, 316, 210, 24);
    ctx.fill();
    ctx.drawImage(qrImage, 360, 840, 180, 180);

    ctx.fillStyle = "#64748B";
    ctx.font = "700 20px Arial";
    ctx.fillText("Keep this receipt with the issued QR ticket.", 226, 1138);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${ticketId.toLowerCase()}-walk-in-receipt.png`;
    link.click();
  }

  return (
    <button className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#0B7DE3] text-sm font-black text-white" onClick={downloadReceipt} type="button">
      Download Walk-in Receipt
    </button>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
