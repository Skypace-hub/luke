import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, resolve } from "node:path";
import { getTenantAccessPolicy } from "@luke/api/services/service-ops";
import { auth } from "@luke/auth";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const maxManualFileBytes = 25 * 1024 * 1024;
const pdfMimeType = "application/pdf";
const uploadDirectoryName = "tmp-files";

const getUploadDirectory = () =>
	resolve(
		process.env.SERVICE_MANUAL_UPLOAD_DIR ??
			join(process.cwd(), "..", "..", uploadDirectoryName)
	);

const isPdfFile = (file: File) =>
	file.type === pdfMimeType || file.name.toLowerCase().endsWith(".pdf");

const sanitizeFileName = (fileName: string) => {
	const extension = extname(fileName).toLowerCase() || ".pdf";
	const baseName = basename(fileName, extname(fileName))
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return `${baseName || "service-manual"}${extension === ".pdf" ? extension : ".pdf"}`;
};

const getFilePath = (fileName: string) => {
	const uploadDirectory = getUploadDirectory();
	const filePath = normalize(join(uploadDirectory, basename(fileName)));

	if (!filePath.startsWith(uploadDirectory)) {
		return null;
	}

	return filePath;
};

const jsonError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

async function requireTenantAccess(
	req: NextRequest,
	tenantId: string,
	capability: "read" | "write"
) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	if (!session) {
		return false;
	}

	const access = await getTenantAccessPolicy(session.user.id, tenantId);

	if (capability === "write") {
		return Boolean(access?.canWrite);
	}

	return Boolean(access?.canRead);
}

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file");
	const tenantId = formData.get("tenantId");

	if (typeof tenantId !== "string" || !tenantId.trim()) {
		return jsonError("Tenant is required.", 400);
	}

	if (!(await requireTenantAccess(req, tenantId, "write"))) {
		return jsonError("Tenant write access is required.", 403);
	}

	if (!(file instanceof File)) {
		return jsonError("PDF file is required.", 400);
	}

	if (!isPdfFile(file)) {
		return jsonError("Only PDF files can be uploaded.", 400);
	}

	if (file.size > maxManualFileBytes) {
		return jsonError("PDF file must be 25 MB or smaller.", 413);
	}

	const uploadDirectory = getUploadDirectory();
	await mkdir(uploadDirectory, { recursive: true });

	const safeFileName = sanitizeFileName(file.name);
	const storedFileName = `${Date.now()}-${randomUUID()}-${safeFileName}`;
	const filePath = join(uploadDirectory, storedFileName);
	const fileBuffer = Buffer.from(await file.arrayBuffer());

	await writeFile(filePath, fileBuffer);

	return NextResponse.json({
		fileName: file.name,
		fileUrl: `/api/service-manual-upload?tenantId=${encodeURIComponent(tenantId)}&file=${encodeURIComponent(storedFileName)}`,
		pageCount: null,
		storageKey: `${uploadDirectoryName}/${storedFileName}`,
		version: "1",
	});
}

export async function GET(req: NextRequest) {
	const storedFileName = req.nextUrl.searchParams.get("file");
	const tenantId = req.nextUrl.searchParams.get("tenantId");

	if (!tenantId) {
		return jsonError("Tenant is required.", 400);
	}

	if (!(await requireTenantAccess(req, tenantId, "read"))) {
		return jsonError("Tenant read access is required.", 403);
	}

	if (!storedFileName) {
		return jsonError("File is required.", 400);
	}

	const filePath = getFilePath(storedFileName);

	if (!filePath) {
		return jsonError("Invalid file path.", 400);
	}

	try {
		const fileBuffer = await readFile(filePath);

		return new NextResponse(new Uint8Array(fileBuffer), {
			headers: {
				"content-disposition": `inline; filename="${basename(storedFileName)}"`,
				"content-type": pdfMimeType,
			},
		});
	} catch {
		return jsonError("File not found.", 404);
	}
}
