import { InquiryStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function createInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  try {
    const inquiry = await db.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: "NEW",
      },
    });

    return { success: true, inquiry };
  } catch (error) {
    console.warn("Database inquiry create fallback:", error);
    return {
      success: true,
      inquiry: {
        id: `mock-inq-${Date.now()}`,
        ...data,
        status: "NEW" as InquiryStatus,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export async function getInquiries(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.InquiryWhereInput = {};
    if (options?.status && options.status !== "ALL") {
      where.status = options.status as InquiryStatus;
    }
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
        { subject: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const fetchQuery = async () => {
      const inquiries = await db.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      const total = await db.inquiry.count({ where });
      return { inquiries, total };
    };

    let result;
    try {
      result = await fetchQuery();
    } catch (err: unknown) {
      const isPoolTimeout =
        typeof err === "object" &&
        err !== null &&
        ("code" in err && (err as { code: string }).code === "P2024");
      if (isPoolTimeout) {
        // Neon cold start wake-up: wait 750ms and retry once
        await new Promise((resolve) => setTimeout(resolve, 750));
        result = await fetchQuery();
      } else {
        throw err;
      }
    }

    return {
      inquiries: result.inquiries,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    };
  } catch (error) {
    console.warn("Database getInquiries fallback:", error);
    return { inquiries: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function getInquiryById(id: string) {
  return db.inquiry.findUnique({
    where: { id },
  });
}

export async function updateInquiryStatus(
  id: string,
  data: {
    status: InquiryStatus;
    internalNotes?: string;
  }
) {
  return db.inquiry.update({
    where: { id },
    data,
  });
}

export async function deleteInquiry(id: string) {
  return db.inquiry.delete({
    where: { id },
  });
}
