import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "landing", "index.html");
  const raw = await fs.readFile(filePath, "utf8");

  const html = raw
    .replace(/(src|href)=(['"])\/assets\//g, `$1=$2/landing/assets/`)
    .replace(/(src|href)=(['"])\/icon\.svg/g, `$1=$2/landing/icon.svg`)
    .replace(/(src|href)=(['"])\/apple-icon\.png/g, `$1=$2/landing/apple-icon.png`)
    .replace(/(src|href)=(['"])\/placeholder-logo\.png/g, `$1=$2/landing/placeholder-logo.png`)
    .replace(/(src|href)=(['"])\/placeholder-logo\.svg/g, `$1=$2/landing/placeholder-logo.svg`)
    .replace(/(src|href)=(['"])\/placeholder-user\.jpg/g, `$1=$2/landing/placeholder-user.jpg`)
    .replace(/(src|href)=(['"])\/placeholder\.jpg/g, `$1=$2/landing/placeholder.jpg`)
    .replace(/(src|href)=(['"])\/placeholder\.svg/g, `$1=$2/landing/placeholder.svg`);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
