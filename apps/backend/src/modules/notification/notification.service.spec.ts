import { Notification, NotificationType } from '../../entities/notification.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  const notificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const userRepository = { find: jest.fn() };

  beforeEach(() => {
    service = new NotificationService(notificationRepository as never, userRepository as never);
    jest.clearAllMocks();
  });

  it('creates and saves a notification for a user', async () => {
    const notification = { id: 'notification-1', recipientId: 'user-1' };
    notificationRepository.create.mockReturnValue(notification);
    notificationRepository.save.mockResolvedValue(notification);

    await expect(
      service.notifyUser(
        'user-1',
        NotificationType.CLAIM_SUBMITTED,
        'Claim submitted',
        'Your claim is under review',
        '/dashboard/claims/claim-1',
        'claim-1',
      ),
    ).resolves.toBe(notification);

    expect(notificationRepository.create).toHaveBeenCalledWith({
      recipientId: 'user-1',
      type: NotificationType.CLAIM_SUBMITTED,
      title: 'Claim submitted',
      message: 'Your claim is under review',
      linkUrl: '/dashboard/claims/claim-1',
      entityId: 'claim-1',
      isRead: false,
    });
  });

  it('notifies every user in the requested roles', async () => {
    userRepository.find.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);
    notificationRepository.create.mockImplementation((value) => value);
    notificationRepository.save.mockImplementation(async (value) => value);

    await service.notifyRoles(
      [UserRole.ADMIN],
      NotificationType.SYSTEM_ALERT,
      'System alert',
      'Please review the queue',
    );

    expect(userRepository.find).toHaveBeenCalledWith({
      where: [{ role: UserRole.ADMIN }],
      select: ['id'],
    });
    expect(notificationRepository.save).toHaveBeenCalledTimes(2);
    expect(notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'admin-1' }),
    );
    expect(notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'admin-2' }),
    );
  });

  it('returns paginated notifications and unread count', async () => {
    const notifications = [{ id: 'notification-1' } as Notification];
    notificationRepository.findAndCount.mockResolvedValue([notifications, 3]);
    notificationRepository.count.mockResolvedValue(2);

    await expect(service.getUserNotifications('user-1', 2, 10)).resolves.toEqual({
      notifications,
      total: 3,
      unreadCount: 2,
    });

    expect(notificationRepository.findAndCount).toHaveBeenCalledWith({
      where: { recipientId: 'user-1' },
      order: { createdAt: 'DESC' },
      skip: 10,
      take: 10,
    });
  });

  it('marks only the requested user notification as read', async () => {
    const notification = { id: 'notification-1', recipientId: 'user-1', isRead: false };
    notificationRepository.findOne.mockResolvedValue(notification);
    notificationRepository.save.mockResolvedValue(notification);

    await service.markAsRead('notification-1', 'user-1');

    expect(notification.isRead).toBe(true);
    expect(notificationRepository.save).toHaveBeenCalledWith(notification);
  });

  it('does not save when the notification does not belong to the user', async () => {
    notificationRepository.findOne.mockResolvedValue(null);

    await service.markAsRead('notification-1', 'user-1');

    expect(notificationRepository.save).not.toHaveBeenCalled();
  });

  it('marks all unread notifications as read', async () => {
    await service.markAllAsRead('user-1');

    expect(notificationRepository.update).toHaveBeenCalledWith(
      { recipientId: 'user-1', isRead: false },
      { isRead: true },
    );
  });
});
