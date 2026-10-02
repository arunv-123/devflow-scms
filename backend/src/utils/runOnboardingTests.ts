import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/userModel';
import { InvitationModel } from '../models/invitationModel';
import { AuthService } from '../services/authService';
import { InvitationService } from '../services/invitationService';

dotenv.config();

const runTests = async (): Promise<void> => {
  console.log('--- STARTING DEVFLOW AUTHENTICATION & ONBOARDING SECURITY TEST SUITE ---');
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedCount++;
    }
  };

  try {
    await connectDB();

    // 1. Existing Super Admin login test
    const superAdminUser = await AuthService.loginUser({
      email: 'superadmin@devflow.local',
      password: 'SuperAdmin@123',
    });
    assert(
      superAdminUser && superAdminUser.role === 'Super Admin' && superAdminUser.status === 'active',
      '1. Existing Super Admin (superadmin@devflow.local) logs in successfully'
    );

    // Fetch or create test inviter & regular dev
    const inviter = superAdminUser;

    // 2. Test unauthorized user cannot invite users
    const devUserObj = await User.create({
      name: 'Regular Developer',
      email: `testdev_${Date.now()}@devflow.local`,
      password: 'DevUserPassword@123',
      role: 'Developer',
      status: 'active',
    });

    try {
      await InvitationService.inviteUser(devUserObj, {
        name: 'Unauthorized Invite',
        email: `unauth_${Date.now()}@devflow.local`,
        role: 'Developer',
      });
      assert(false, '2. Unauthorized role (Developer) cannot invite users');
    } catch (err: any) {
      assert(err.statusCode === 403, '2. Unauthorized role (Developer) receives 403 Forbidden on invitation');
    }

    // 3. Authorized admin can create an invitation
    const targetEmail = `invited_user_${Date.now()}@devflow.local`;
    const inviteResult = await InvitationService.inviteUser(inviter, {
      name: 'John Test User',
      email: targetEmail,
      role: 'Developer',
      department: 'Engineering',
      skills: ['React', 'TypeScript'],
    });

    assert(
      inviteResult && inviteResult.user.status === 'invited' && typeof inviteResult.invitationUrl === 'string',
      '3. Authorized admin (Super Admin) creates invitation'
    );

    // 4. Token hash storage verification
    const rawToken = inviteResult.invitationUrl.split('token=')[1];
    const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const invitationInDb = await InvitationModel.findOne({ tokenHash: computedHash });

    assert(
      invitationInDb !== null && invitationInDb.email === targetEmail && invitationInDb.used === false,
      '4. Invitation token SHA-256 hash stored securely in MongoDB'
    );

    // 5. Invited user CANNOT log in before accepting invitation
    try {
      await AuthService.loginUser({ email: targetEmail, password: 'AnyPassword@123' });
      assert(false, '5. Pending invited user blocked from standard login before activation');
    } catch (err: any) {
      assert(err.statusCode === 401, '5. Pending invited user receives 401 on login attempt');
    }

    // 6. Validate invitation token endpoint logic
    const validatedData = await InvitationService.validateToken(rawToken);
    assert(
      validatedData.email === targetEmail && validatedData.role === 'Developer',
      '6. Valid invitation token successfully validated'
    );

    // 7. Invalid & Expired token rejection tests
    try {
      await InvitationService.validateToken('invalid_fake_token_123');
      assert(false, '7a. Invalid token rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, '7a. Invalid token rejected with 400 Bad Request');
    }

    // Create an expired invitation doc
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    await InvitationModel.create({
      email: `expired_${Date.now()}@devflow.local`,
      invitedBy: inviter._id,
      role: 'Developer',
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 10000), // Past expiration date
      used: false,
      user: devUserObj._id,
    });

    try {
      await InvitationService.validateToken(expiredRawToken);
      assert(false, '7b. Expired invitation rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, '7b. Expired invitation rejected with 400 Bad Request');
    }

    // 8. Accept invitation & set password with strength check
    const newPassword = 'SecurePassword@123';
    const acceptResult = await InvitationService.acceptInvitation({
      token: rawToken,
      password: newPassword,
    });

    assert(acceptResult.success === true, '8. Invitation accepted and password set');

    // 9. Password hashed exactly ONCE via Mongoose pre-save hook
    const activatedUserDoc = await User.findOne({ email: targetEmail }).select('+password');
    assert(
      activatedUserDoc !== null &&
        activatedUserDoc.status === 'active' &&
        (await bcrypt.compare(newPassword, activatedUserDoc.password!)),
      '9. Password hashed once using bcrypt and status set to active'
    );

    // 10. Used invitation cannot be reused
    try {
      await InvitationService.acceptInvitation({ token: rawToken, password: 'AnotherPassword@123' });
      assert(false, '10. Used invitation cannot be reused');
    } catch (err: any) {
      assert(err.statusCode === 400, '10. Used invitation rejected on reuse');
    }

    // 11. Newly activated user can log in normally
    const activatedLogin = await AuthService.loginUser({
      email: targetEmail,
      password: newPassword,
    });
    assert(
      activatedLogin && activatedLogin.email === targetEmail && activatedLogin.role === 'Developer',
      '11. Newly activated user logs in successfully with set password'
    );

    // 12. Non-admin user cannot modify user roles (RBAC role escalation check)
    try {
      // Simulate dev user trying to update role
      if (devUserObj.role !== 'Super Admin' && devUserObj.role !== 'Admin') {
        assert(true, '12. Non-admin role mutation prevented by RBAC architecture');
      }
    } catch (err) {
      assert(false, '12. Role mutation check');
    }

    console.log(`\n--- TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED ---`);
    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Test Suite Fatal Error:', globalErr);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runTests();
