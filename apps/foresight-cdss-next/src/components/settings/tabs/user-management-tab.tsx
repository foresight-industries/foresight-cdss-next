import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

interface TeamMember {
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserManagementTabProps {
  teamMembers: TeamMember[];
  onInviteUser: () => void;
  onEditUser: (index: number) => void;
  onRemoveUser: (index: number) => void;
}

export function UserManagementTab({ 
  teamMembers, 
  onInviteUser, 
  onEditUser, 
  onRemoveUser 
}: Readonly<UserManagementTabProps>) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Members
          </h3>
          <Button size="sm" onClick={onInviteUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{user.role}</Badge>
                <Badge
                  variant={user.status === "Active" ? "default" : "secondary"}
                >
                  {user.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditUser(index)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveUser(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}