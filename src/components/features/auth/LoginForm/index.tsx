"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import styles from './LoginForm.module.scss';
import classNames from 'classnames';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('이메일을 확인해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    
    // Auth logic
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('입력하신 사용자 이름을 사용하는 계정을 찾을 수 없습니다. 사용자 이름을 확인하고 다시 시도하세요.');
      setLoading(false);
    } else {
      router.push('/'); // Redirect to home on success
      router.refresh(); 
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      
      {/* Email Field */}
      <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!emailValue })}>
        <input 
          {...register('email')} 
          type="text" 
          className={styles.input} 
        />
        <label className={styles.floatingLabel}>전화번호, 사용자 이름 또는 이메일</label>
      </div>

      {/* Password Field */}
      <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!passwordValue })}>
        <input 
          {...register('password')} 
          type="password" 
          className={styles.input} 
        />
        <label className={styles.floatingLabel}>비밀번호</label>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <button type="submit" className={styles.loginBtn} disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <div className={styles.separator}>
        <span>또는</span>
      </div>

      <button type="button" className={styles.socialLogin} onClick={() => alert('Social Login Coming Soon')}>
        <span>Facebook으로 로그인</span>
      </button>

      <Link href="#" className={styles.forgotPassword}>
        비밀번호를 잊으셨나요?
      </Link>
    </form>
  );
}
