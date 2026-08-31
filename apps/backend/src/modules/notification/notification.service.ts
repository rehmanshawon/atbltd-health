import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Send notification to a specific user
   */
  async notifyUser(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string,
    entityId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId,
      type,
      title,
      message,
      linkUrl,
      entityId,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  /**
   * Send notification to all users with specific roles
   */
  async notifyRoles(
    roles: UserRole[],
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string,
    entityId?: string,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: roles.map((role) => ({ role })),
      select: ['id'],
    });

    for (const user of users) {
      await this.notifyUser(user.id, type, title, message, linkUrl, entityId);
    }
  }

  /**
   * Get notifications for current user
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });
    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }
}
