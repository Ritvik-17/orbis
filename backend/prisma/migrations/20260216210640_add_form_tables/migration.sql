-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('TEXT', 'MCQ', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWNS', 'STAR_RATINGS');

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "description" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "form_id" UUID,
    "question_text" TEXT NOT NULL DEFAULT '',
    "question_type" "question_type",

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "form_id" UUID,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submission_id" UUID,
    "question_id" UUID,
    "answer" TEXT DEFAULT '',

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
