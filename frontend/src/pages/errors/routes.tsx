import { ExpiredInvitePage } from "./ExpiredInvitePage";
import { UnauthorizedPage } from "./ForbiddenPage";

export const unauthorizedRoutes = [
  {
    path: 'unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: 'expired-invitation',
    element: <ExpiredInvitePage />,
  }
];   