import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Buffer kosong" }, { status: 400 });
    }

    const targetPath = path.join(process.cwd(), "public", "targets", "targets.mind");
    fs.writeFileSync(targetPath, buffer);

    console.log(`[SAVE TARGETS] Berhasil menulis ${buffer.length} bytes ke ${targetPath}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan targets.mind (${buffer.length} bytes)`,
    });
  } catch (err: any) {
    console.error("[SAVE TARGETS ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
