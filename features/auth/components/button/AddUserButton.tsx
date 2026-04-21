"use client";
import React from "react";
import { useAddUserDialog } from "../../hooks/useAddUserDialog";
import { Button } from "@/components/ui/button";
import { whoCanAccessSpecialFieldsWithManager } from "@/constant";
import useCurrentUser from "../../hooks/useCurrentUser";

const AddUserButton = ({className}:{className?:string}) => {
  const { data:user } = useCurrentUser();
  const onOpen = useAddUserDialog((s) => s.onOpen);
  return (
    <>
    {whoCanAccessSpecialFieldsWithManager.includes(user?.role)&&(  
      <Button
      className={className}
      onClick={() => {
        onOpen();
      }}
      >
      Add User
    </Button>
    )}
      </>
  );
};

export default AddUserButton;
