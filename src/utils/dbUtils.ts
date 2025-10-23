import { Pool, QueryResult, QueryResultRow } from "pg";
import { Event } from "@/types/events";
import { Membership, dbMembership, mapdbMembershipToMembership } from "@/types/memberships";
import { User, mapRoleToUserRole, mapdbUserToUser } from "@/types/user";
import {
  Product,
  dbProduct,
  ProductVariant,
  mapdbProductToProduct,
  dbProductVariant,
  Order,
  dbOrder,
  mapdbOrderToOrder,
  OrderStatus,
  Category,
  dbCategory,
  mapdbCategoryToCategory,
} from "@/types/shop";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db_query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

export const createUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.istid || !user.name || !user.email) return null;
  try {
    const {
      rows: [newUser],
    } = await db_query<User>(
      `SELECT * FROM neiist.add_user($1::VARCHAR(10), $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT, $7::TEXT[])`,
      [
        user.istid,
        user.name,
        user.email,
        user.alternativeEmail,
        user.phone,
        user.photo,
        user.courses,
      ]
    );
    if (!newUser) return null;
    newUser.roles = newUser.roles?.map(mapRoleToUserRole);
    return newUser ? mapdbUserToUser(newUser) : null;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

export const updateUser = async (istid: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const {
      rows: [updatedUser],
    } = await db_query<User>("SELECT * FROM neiist.update_user($1::VARCHAR(10), $2::JSONB)", [
      istid,
      JSON.stringify(updates),
    ]);
    if (!updatedUser) return null;
    updatedUser.roles = updatedUser.roles?.map(mapRoleToUserRole);
    return updatedUser ? mapdbUserToUser(updatedUser) : null;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.update_user_photo($1::VARCHAR(10), $2::TEXT)", [
      istid,
      photoData,
    ]);
    return true;
  } catch (error) {
    console.error("Error updating user photo:", error);
    return false;
  }
};

export const getUser = async (istid: string): Promise<User | null> => {
  try {
    const {
      rows: [user],
    } = await db_query<User>("SELECT * FROM neiist.get_user($1::VARCHAR(10))", [istid]);
    return user ? mapdbUserToUser(user) : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { rows } = await db_query<User>("SELECT * FROM neiist.get_all_users()");
    return rows.map(mapdbUserToUser);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

export const addMember = async (
  istid: string,
  department = "Members",
  role = "Member"
): Promise<boolean> => {
  try {
    try {
      await db_query("SELECT neiist.add_department($1)", [department]);
      await db_query("SELECT neiist.add_team($1, $2)", [department, "General membership team"]);
      await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
        department,
        role,
        "member",
      ]);
    } catch {}
    await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, department, role]);
    return true;
  } catch (error) {
    console.error("Error adding member:", error);
    return false;
  }
};

export const addCollaborator = async (
  istid: string,
  teams: string[],
  position: string
): Promise<boolean> => {
  try {
    for (const team of teams) {
      try {
        await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
          team,
          position,
          "coordinator",
        ]);
      } catch {}
      await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, team, position]);
    }
    return true;
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return false;
  }
};

export const removeRole = async (
  istid: string,
  department: string,
  role: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_team_member($1, $2, $3)", [istid, department, role]);
    return true;
  } catch (error) {
    console.error("Error removing role:", error);
    return false;
  }
};

export const getUsersByAccess = async (access: string): Promise<User[]> => {
  try {
    const { rows } = await db_query<User>(
      "SELECT istid, name, email, phone, courses, campus, photo_path as photo FROM neiist.get_users_by_access($1)",
      [access]
    );
    return rows.map(mapdbUserToUser);
  } catch (error) {
    console.error("Error fetching users by access:", error);
    return [];
  }
};

export const getDepartmentRoles = async (
  departmentName: string
): Promise<Array<{ role_name: string; access: string; active: boolean }>> => {
  try {
    const { rows } = await db_query<{
      role_name: string;
      access: string;
      active: boolean;
    }>("SELECT role_name, access, active FROM neiist.get_department_roles($1)", [departmentName]);
    return rows;
  } catch (error) {
    console.error("Error fetching department roles:", error);
    return [];
  }
};

export const addEmailVerification = async (
  istid: string,
  email: string,
  token: string,
  expiresAt: string
): Promise<void> => {
  try {
    await db_query("SELECT neiist.add_email_verification($1, $2, $3, $4)", [
      istid,
      email,
      token,
      expiresAt,
    ]);
  } catch (error) {
    console.error("Error adding email verification:", error);
    throw error;
  }
};

export const getEmailVerification = async (
  token: string
): Promise<{ istid: string; email: string; expires_at: string } | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<{ istid: string; email: string; expires_at: string }>(
      "SELECT * FROM neiist.get_email_verification($1)",
      [token]
    );
    return row ?? null;
  } catch (error) {
    console.error("Error fetching email verification:", error);
    return null;
  }
};

export const deleteEmailVerification = async (token: string): Promise<void> => {
  try {
    await db_query("SELECT neiist.delete_email_verification($1)", [token]);
  } catch (error) {
    console.error("Error deleting email verification:", error);
    throw error;
  }
};

export const getEmailVerificationByUser = async (
  istid: string
): Promise<{ email: string; expires_at: string } | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<{ email: string; expires_at: string }>(
      "SELECT * FROM neiist.get_email_verification_by_user($1)",
      [istid]
    );
    return row ?? null;
  } catch (error) {
    console.error("Error fetching pending alternative email:", error);
    return null;
  }
};

// Department management
export const addDepartment = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_department($1)", [name]);
    return true;
  } catch (error) {
    console.error("Error adding department:", error);
    return false;
  }
};

export const removeDepartment = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_department($1)", [name]);
    return true;
  } catch (error) {
    console.error("Error removing department:", error);
    return false;
  }
};

export const getAllDepartments = async (): Promise<
  Array<{ name: string; department_type: string; active: boolean }>
> => {
  try {
    const { rows } = await db_query<{ name: string; department_type: string; active: boolean }>(
      "SELECT * FROM neiist.get_all_departments()"
    );
    return rows;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

// Team management
export const addTeam = async (name: string, description: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_team($1, $2)", [name, description]);
    return true;
  } catch (error) {
    console.error("Error adding team:", error);
    return false;
  }
};

export const removeTeam = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_team($1)", [name]);
    return true;
  } catch (error) {
    console.error("Error removing team:", error);
    return false;
  }
};

export const getAllTeams = async (): Promise<
  Array<{ name: string; description: string; active: boolean }>
> => {
  try {
    const { rows } = await db_query<{
      name: string;
      description: string;
      active: boolean;
    }>("SELECT * FROM neiist.get_all_teams()");
    return rows;
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
};

// Admin body management
export const addAdminBody = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_admin_body($1)", [name]);
    return true;
  } catch (error) {
    console.error("Error adding admin body:", error);
    return false;
  }
};

export const removeAdminBody = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_admin_body($1)", [name]);
    return true;
  } catch (error) {
    console.error("Error removing admin body:", error);
    return false;
  }
};

export const getAllAdminBodies = async (): Promise<Array<{ name: string; active: boolean }>> => {
  try {
    const { rows } = await db_query<{ name: string; active: boolean }>(
      "SELECT * FROM neiist.get_all_admin_bodies()"
    );
    return rows;
  } catch (error) {
    console.error("Error fetching admin bodies:", error);
    return [];
  }
};

// Valid department roles management
export const addValidDepartmentRole = async (
  departmentName: string,
  roleName: string,
  access: "admin" | "coordinator" | "member" = "member"
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
      departmentName,
      roleName,
      access,
    ]);
    return true;
  } catch (error) {
    console.error("Error adding valid department role:", error);
    return false;
  }
};

export const removeValidDepartmentRole = async (
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_valid_department_role($1, $2)", [
      departmentName,
      roleName,
    ]);
    return true;
  } catch (error) {
    console.error("Error removing valid department role:", error);
    return false;
  }
};

export const getAllValidDepartmentRoles = async (): Promise<
  Array<{
    department_name: string;
    role_name: string;
    access: string;
    active: boolean;
  }>
> => {
  try {
    const { rows } = await db_query<{
      department_name: string;
      role_name: string;
      access: string;
      active: boolean;
    }>("SELECT * FROM neiist.get_all_valid_department_roles()");
    return rows;
  } catch (error) {
    console.error("Error fetching valid department roles:", error);
    return [];
  }
};

// Team member management
export const addTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, departmentName, roleName]);
    return true;
  } catch (error) {
    console.error("Error adding team member:", error);
    return false;
  }
};

export const removeTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_team_member($1, $2, $3)", [
      istid,
      departmentName,
      roleName,
    ]);
    return true;
  } catch (error) {
    console.error("Error removing team member:", error);
    return false;
  }
};

export const getAllMemberships = async (): Promise<Membership[]> => {
  try {
    const [dbMemberships, users] = await Promise.all([
      db_query<dbMembership>("SELECT * FROM neiist.get_all_memberships()").then((res) => res.rows),
      getAllUsers(),
    ]);
    return dbMemberships.map((raw, idx) => {
      const user = users.find((u) => u.istid === raw.user_istid);
      return mapdbMembershipToMembership(raw, user?.email || "", user?.photo || "", idx);
    });
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return [];
  }
};

export const getDepartmentRoleOrder = async (
  departmentName: string
): Promise<Array<{ role_name: string; position: number }>> => {
  try {
    const { rows } = await db_query<{ role_name: string; position: number }>(
      "SELECT * FROM neiist.get_department_role_order($1)",
      [departmentName]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching department role order:", error);
    return [];
  }
};

export const setDepartmentRoleOrder = async (
  departmentName: string,
  roles: string[]
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.set_department_role_order($1, $2)", [departmentName, roles]);
    return true;
  } catch (error) {
    console.error("Error setting department role order:", error);
    return false;
  }
};

export const addEvent = async (event: Partial<Event>): Promise<Event | null> => {
  try {
    const { rows } = await db_query<Event>("SELECT * FROM neiist.add_event($1, $2, $3)", [
      event.title,
      event.description,
      event.image,
    ]);
    return rows[0] ?? null;
  } catch (error) {
    console.error("Error saving the event:", error);
    return null;
  }
};

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const { rows } = await db_query<Event>("SELECT * FROM neiist.get_all_events()");
    return rows;
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
};

export const addProduct = async (
  product: Partial<Product> & {
    name: string;
    price: number;
    stock_type: Product["stock_type"];
    active?: boolean;
  }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(
    `SELECT * FROM neiist.add_product($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      product.name,
      product.description ?? null,
      product.price,
      product.images ?? [],
      product.category ?? null,
      product.stock_type,
      product.stock_quantity ?? null,
      product.order_deadline ?? null,
      product.estimated_delivery ?? null,
      product.active ?? true,
    ]
  );
  return row ? mapdbProductToProduct(row) : null;
};

export const addProductVariant = async (
  productId: number,
  variant: Partial<ProductVariant> & { price_modifier?: number }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.add_product_variant($1,$2,$3,$4,$5,$6,$7)`, [
    productId,
    variant.sku ?? null,
    variant.images ?? [],
    variant.price_modifier ?? 0,
    variant.stock_quantity ?? null,
    variant.active ?? true,
    JSON.stringify(variant.options ?? {}),
  ]);
  return row ? mapdbProductToProduct(row) : null;
};

export const getAllProducts = async (): Promise<Product[]> => {
  const { rows } = await db_query<dbProduct>(`SELECT * FROM neiist.get_all_products()`);
  return rows.map(mapdbProductToProduct);
};

export const getProduct = async (productId: number): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.get_product($1)`, [productId]);
  return row ? mapdbProductToProduct(row) : null;
};

export const updateProduct = async (
  productId: number,
  updates: Partial<Product> & { category?: string; active?: boolean }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.update_product($1,$2)`, [
    productId,
    JSON.stringify(updates),
  ]);
  return row ? mapdbProductToProduct(row) : null;
};

export const updateProductVariant = async (
  variantId: number,
  updates: Partial<ProductVariant>
): Promise<ProductVariant | null> => {
  const {
    rows: [row],
  } = await db_query<dbProductVariant>(`SELECT * FROM neiist.update_product_variant($1,$2)`, [
    variantId,
    JSON.stringify({
      sku: updates.sku,
      images: updates.images,
      price_modifier: updates.price_modifier,
      stock_quantity: updates.stock_quantity,
      active: updates.active,
      options: updates.options,
    }),
  ]);
  return row
    ? {
        id: row.id,
        sku: row.sku ?? undefined,
        images: row.images ?? undefined,
        price_modifier: Number(row.price_modifier ?? 0),
        stock_quantity: row.stock_quantity ?? undefined,
        active: row.active,
        options: row.options ?? {},
        label: row.label ?? undefined,
      }
    : null;
};

export const newOrder = async (
  order: Partial<Order> & {
    user_istid?: string;
    items: Array<{ product_id: number; variant_id?: number; quantity: number }>;
  }
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.new_order($1,$2,$3,$4,$5,$6,$7)`, [
    order.user_istid ?? null,
    order.customer_nif ?? null,
    order.campus ?? null,
    order.notes ?? null,
    order.payment_method ?? null,
    order.payment_reference ?? null,
    JSON.stringify(
      order.items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id ?? null,
        quantity: i.quantity,
      }))
    ),
  ]);
  return row ? mapdbOrderToOrder(row) : null;
};

export const getAllOrders = async (): Promise<Order[]> => {
  const { rows } = await db_query<dbOrder>(`SELECT * FROM neiist.get_all_orders()`);
  return rows.map(mapdbOrderToOrder);
};

export const updateOrder = async (
  orderId: number,
  updates: Partial<Order>
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.update_order($1,$2)`, [
    orderId,
    JSON.stringify(updates),
  ]);
  return row ? mapdbOrderToOrder(row) : null;
};

export const setOrderState = async (
  orderId: number,
  status: OrderStatus,
  actor?: string
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.set_order_state($1,$2,$3)`, [
    orderId,
    status,
    actor ?? null,
  ]);
  return row ? mapdbOrderToOrder(row) : null;
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { rows } = await db_query<Category>("SELECT * FROM neiist.get_all_categories()");
    return rows;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (name: string): Promise<Category | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbCategory>(`SELECT * FROM neiist.get_or_create_category($1)`, [name]);
    return row ? mapdbCategoryToCategory(row) : null;
  } catch (error) {
    console.error("Error adding category:", error);
    return null;
  }
};
