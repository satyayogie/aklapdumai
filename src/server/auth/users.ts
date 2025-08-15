"use server"

import {auth} from "@/lib/auth";

export const signIn = async(email:string,password:string)=>{
  try{
    await auth.api.signInEmail({
      body:{
        email,
        password,
      }
    })
    return {
      success: true,
      message: "Successfully signed in",
    }

  } catch(error){
      const e = error as Error
      return{
        success: false,
        message: e.message|| "An unknown error occurred"
      }
  }
}
