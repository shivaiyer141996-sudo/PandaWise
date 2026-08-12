import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: "parent" };
    user: { sub: string; role: "parent" };
  }
}
