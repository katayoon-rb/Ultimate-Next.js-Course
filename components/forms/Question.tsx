"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
// import { useRouter, usePathname } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { QuestionsSchema } from "@/lib/validations";
import { createQuestion } from "@/lib/actions/question.action";
import { useTheme } from "@/context/ThemeProvider";
// import page from "@/app/(root)/(home)/page";
import { useRouter, usePathname } from "next/navigation";
// import page from "@/app/(root)/(home)/page";

interface Props {
  type?: string;
  mongoUserId: string;
  questionDetails?: string;
}

const Question = ({ type, mongoUserId, questionDetails }: Props) => {
  // Text Editor ref
  const editorRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Router
  const router = useRouter();
  const pathname = usePathname();

  // For editor dark and light mode
  const { mode } = useTheme();

  // In edit mode data will be shown by default
  const parsedQuestionDetails =
    questionDetails && JSON.parse(questionDetails || "");
  // const groupedTags = parsedQuestionDetails?.tags.map((tag: any) => tag.name);

  const form = useForm<z.infer<typeof QuestionsSchema>>({
    resolver: zodResolver(QuestionsSchema),
    defaultValues: {
      // title: parsedQuestionDetails?.title || "",
      // explanation: parsedQuestionDetails?.content || "",
      // tags: groupedTags || [],
      title: "",
      explanation: "",
      tags: [],
    },
  });

  async function onSubmit(values: z.infer<typeof QuestionsSchema>) {
    setIsSubmitting(true);
    try {
      await createQuestion({
        title: values.title,
        content: values.explanation,
        tags: values.tags,
        author: JSON.parse(mongoUserId),
        path: pathname,
      });
      router.push("/");

      if (type === "edit") {
        // await editQuestion({
        //   questionId: parsedQuestionDetails?._id,
        //   title: values.title,
        //   content: values.explanation,
        //   path: pathname,
        // });
        // router.push(`/question/${parsedQuestionDetails._id}`);
      } else {
        // await createQuestion({
        //   title: values.title,
        //   content: values.explanation,
        //   tags: values.tags,
        //   author: JSON.parse(mongoUserId),
        //   path: pathname,
        // });
        // router.push("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: any
  ) => {
    if (e.key === "Enter" && field.name === "tags") {
      e.preventDefault();
      const tagInput = e.target as HTMLInputElement;
      const tagValue = tagInput.value.trim();

      if (tagValue !== "") {
        // Error when the value is > 15 chars
        if (tagValue.length > 15) {
          return form.setError("tags", {
            type: "required",
            message: "Tag must be less than 15 characters",
          });
        }

        // If the tag already in the fields
        if (!field.value.includes(tagValue as never)) {
          form.setValue("tags", [...field.value, tagValue]);
          tagInput.value = "";
          form.clearErrors("tags");
        }
      } else {
        form.trigger();
      }
    }
  };
  const handleTagRemove = (tag: string, field: any) => {
    form.setValue(
      "tags",
      field.value.filter((t: string) => t !== tag)
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col gap-10'
      >
        {/* Title */}
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col'>
              <FormLabel className='paragraph-semibold text-dark400_light800'>
                Question Title <span className='text-primary-500'>*</span>
              </FormLabel>

              <FormControl className='mt-3.5'>
                <Input
                  className='no-focus paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 min-h-[56px] border'
                  {...field}
                />
              </FormControl>

              <FormDescription className='body-regular mt-2.5 text-light-500'>
                Be specific and imagine you&apos;re asking question to another
                person.
              </FormDescription>

              <FormMessage className='text-red-500' />
            </FormItem>
          )}
        />

        {/* Explanation */}
        <FormField
          control={form.control}
          name='explanation'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='paragraph-semibold text-dark400_light800'>
                Detailed explanation of your problem.
                <span className='text-primary-500'>*</span>
              </FormLabel>

              <FormControl className='mt-3.5'>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                  onInit={(evt, editor) => {
                    // @ts-ignore
                    editorRef.current = editor;
                  }}
                  onBlur={field.onBlur}
                  onEditorChange={(content) => field.onChange(content)}
                  initialValue={parsedQuestionDetails?.content || ""}
                  init={{
                    height: 350,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "codesample",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                    ],
                    toolbar:
                      "undo redo | " +
                      "codesample | bold italic forecolor | alignleft aligncenter |" +
                      "alignright alignjustify | bullist numlist",
                    content_style:
                      "body { font-family:Inter,sans-serif; font-size:16px }",
                    skin: mode === "dark" ? "oxide-dark" : "oxide",
                    content_css: mode === "dark" && "dark",
                  }}
                />
              </FormControl>

              <FormDescription className='body-regular mt-2.5 text-light-500'>
                Introduce the problem and expand on what you put in the title.
                Minimum 20 characters.
              </FormDescription>

              <FormMessage className='text-red-500' />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name='tags'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col'>
              <FormLabel className='paragraph-semibold text-dark400_light800'>
                Tags<span className='text-primary-500'>*</span>
              </FormLabel>

              <FormControl className='mt-3.5'>
                <>
                  <Input
                    disabled={type === "edit"}
                    className='no-focus paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 min-h-[56px] border'
                    placeholder='Add tags...'
                    onKeyDown={(e) => handleInputKeyDown(e, field)}
                  />

                  {/* Tags added by the user */}
                  {field.value.length > 0 && (
                    <div className='flex-start mt-2.5 gap-2.5'>
                      {field.value.map((tag: any) => {
                        return (
                          <Badge
                            key={tag}
                            className='subtle-medium background-light800_dark300 text-light400_light500 flex items-center justify-center gap-2 rounded-md border-none px-4 py-2 uppercase'
                          >
                            {tag}
                            {type !== "edit" && (
                              <Image
                                src='/assets/icons/close.svg'
                                alt='close icon'
                                width={12}
                                height={12}
                                className='cursor-pointer object-contain invert-0 dark:invert'
                                onClick={() => handleTagRemove(tag, field)}
                              />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </>
              </FormControl>

              <FormDescription className='body-regular mt-2.5 text-light-500'>
                Add up to 3 tags to describe what your question is about. You
                need to press enter to add a tag.
              </FormDescription>

              <FormMessage className='text-red-500' />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className='primary-gradient w-fit !text-light-900'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>{type === "edit" ? "Editing..." : "Posting..."}</>
          ) : (
            <>{type === "edit" ? "Edit Question" : "Ask a Questioin"}</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default Question;