'use server';

//import { stackServerApp } from "../../stack/server";
import { db } from '@/app/lib/db'; // assuming you have a shared Prisma client

export async function deletePost(formData: FormData) {
 // const session =  stackServerApp.validateRequest();
 const session = 1;
 
  if (!session) throw new Error('Unauthorized');

  const id = Number(formData.get('id'));

  await db.post.delete({
    where: {
      id,
      
    },
  });
}
