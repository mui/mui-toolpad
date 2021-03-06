-- CreateEnum
CREATE TYPE "DomNodeType" AS ENUM ('app', 'connection', 'api', 'theme', 'page', 'element', 'codeComponent', 'derivedState', 'queryState');

-- CreateEnum
CREATE TYPE "DomNodeAttributeType" AS ENUM ('const', 'binding', 'boundExpression', 'jsExpression');

-- CreateTable
CREATE TABLE "StudioDomNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DomNodeType" NOT NULL,
    "parentId" TEXT,
    "parentIndex" TEXT,
    "parentProp" TEXT,

    CONSTRAINT "StudioDomNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDomNodeAttribute" (
    "nodeId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DomNodeAttributeType" NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Release" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" BYTEA NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudioDomNodeAttribute_nodeId_namespace_name_key" ON "StudioDomNodeAttribute"("nodeId", "namespace", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Release_version_key" ON "Release"("version");

-- AddForeignKey
ALTER TABLE "StudioDomNode" ADD CONSTRAINT "StudioDomNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StudioDomNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDomNodeAttribute" ADD CONSTRAINT "StudioDomNodeAttribute_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "StudioDomNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_version_fkey" FOREIGN KEY ("version") REFERENCES "Release"("version") ON DELETE RESTRICT ON UPDATE CASCADE;
