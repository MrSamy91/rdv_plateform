-- Associate services with the members who can perform them.
CREATE TABLE "member_service" (
    "memberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_service_pkey" PRIMARY KEY ("memberId","serviceId")
);

ALTER TABLE "member_service" ADD CONSTRAINT "member_service_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_service" ADD CONSTRAINT "member_service_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
