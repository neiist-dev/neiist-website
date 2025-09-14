import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllOrders, newOrder, getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";

async function checkMemberPermission() {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }
    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }
    const currentUserRoles = currentUser.roles?.map(mapRoleToUserRole) || [UserRole._GUEST];
    const hasPermission = currentUserRoles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER].includes(role)
    );
    if (!hasPermission) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Member, Coordinator or Admin required" },
          { status: 403 }
        ),
      };
    }
    return { isAuthorized: true, user: currentUser };
  } catch {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

async function checkGuestPermission() {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }
    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }
    return { isAuthorized: true, user: currentUser };
  } catch {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

export async function GET() {
  const permissionCheck = await checkMemberPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await checkGuestPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;
  try {
    const body = await request.json();
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }
    if (!["MBWay", "Dinheiro"].includes(body.payment_method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    if (!permissionCheck.user) {
      return NextResponse.json({ error: "User information missing" }, { status: 500 });
    }
    const order = await newOrder({
      user_istid: permissionCheck.user.istid,
      customer_nif: body.customer_nif ?? null,
      campus: body.campus ?? null,
      notes: body.notes ?? null,
      payment_method: body.payment_method,
      payment_reference: body.payment_reference ?? null,
      items: body.items,
    });
    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
