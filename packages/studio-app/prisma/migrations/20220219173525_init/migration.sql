-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('const', 'stringExpression', 'jsExpression');

-- CreateTable
CREATE TABLE "StudioDomNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "parentIndex" TEXT NOT NULL,
    "parentProp" TEXT NOT NULL,
    "releaseId" TEXT,

    CONSTRAINT "StudioDomNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDomNodeAttribute" (
    "nodeId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "value" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudioDomNodeAttribute_nodeId_namespace_name_key" ON "StudioDomNodeAttribute"("nodeId", "namespace", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Release_version_key" ON "Release"("version");

-- AddForeignKey
ALTER TABLE "StudioDomNode" ADD CONSTRAINT "StudioDomNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StudioDomNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDomNode" ADD CONSTRAINT "StudioDomNode_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDomNodeAttribute" ADD CONSTRAINT "StudioDomNodeAttribute_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "StudioDomNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
