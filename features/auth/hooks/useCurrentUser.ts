import { currentUserAction } from "@/action/currentUserAction";
import { useQuery } from "@tanstack/react-query";
// import { toast } from "sonner";

const useCurrentUser = () => {
  const id = "session";
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const user = await currentUserAction();
      if (!user) {
        throw new Error("User not found, please login again");
      }
      if (typeof user === "string") {
        // toast.error(user, { id });
        throw new Error(user);
      }
      return user;
    },
    retry: 1,
  });
};

export default useCurrentUser;
