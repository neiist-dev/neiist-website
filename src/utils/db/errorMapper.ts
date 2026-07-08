import { DatabaseError } from "@/types/errors";

export function parseDatabaseError(error: unknown): DatabaseError {
  const dbError = error as { message?: string; code?: string };
  const message = dbError?.message ?? "";

  // Order & Product errors
  if (message.includes("Order deadline has passed"))
    return new DatabaseError("O prazo de encomenda do produto já terminou", 400);

  if (message.includes("Insufficient variant stock"))
    return new DatabaseError("Stock insuficiente para a variante selecionada", 400);

  if (message.includes("Insufficient product stock"))
    return new DatabaseError("Stock insuficiente para o produto selecionado", 400);

  if (message.includes("Product") && message.includes("not found or inactive"))
    return new DatabaseError("Produto indisponível", 400);

  if (message.includes("Variant") && message.includes("not found or inactive"))
    return new DatabaseError("Variante indisponível", 400);

  if (message.includes("Product") && message.includes("not found"))
    return new DatabaseError("Produto não encontrado", 404);

  if (message.includes("Variant") && message.includes("not found"))
    return new DatabaseError("Variante não encontrada", 404);

  if (message.includes("Invalid quantity for product_id"))
    return new DatabaseError("Quantidade inválida", 400);

  // Discount errors
  if (message.includes("Discount code is required"))
    return new DatabaseError("Código de desconto obrigatório", 400);

  if (message.includes("Discount code not found or inactive"))
    return new DatabaseError("Código de desconto inválido ou inativo", 400);

  if (message.includes("Discount code expired"))
    return new DatabaseError("Código de desconto expirado", 400);

  if (message.includes("Discount code max uses reached"))
    return new DatabaseError("Código de desconto esgotado", 400);

  if (message.includes("Discount code not valid for user"))
    return new DatabaseError("Código de desconto não é válido para este utilizador", 400);

  if (message.includes("Discount code not applicable to these products"))
    return new DatabaseError("Código de desconto não é aplicável a estes produtos", 400);

  // Voting errors
  if (message.includes("User has already voted"))
    return new DatabaseError("Já votaste nesta sessão", 400);

  if (message.includes("Voting session is not active"))
    return new DatabaseError("A sessão de votação não está ativa", 400);

  if (message.includes("Invalid nominee")) return new DatabaseError("Opção inválida", 400);

  // User/Auth errors
  if (message.includes("Email already in use"))
    return new DatabaseError("Este email já está em uso", 409);

  // Generic Postgres codes
  if (dbError?.code === "P0001") return new DatabaseError("Pedido inválido", 400); // generic RAISE EXCEPTION

  if (dbError?.code === "23505") return new DatabaseError("Registo duplicado", 409); // Unique constraint violation

  // Fallback
  return new DatabaseError("Ocorreu um erro inesperado na base de dados.", 500);
}
