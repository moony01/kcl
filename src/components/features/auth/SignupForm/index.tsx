"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import styles from './SignupForm.module.scss';
import classNames from 'classnames';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const schema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  username: z.string().min(3, '사용자 이름은 3자 이상이어야 합니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const emailValue = watch('email');
  const usernameValue = watch('username');
  const passwordValue = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    
    // Auth logic
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Typically need to verify email or auto login
      alert('가입이 완료되었습니다! 로그인해주세요.');
      router.push('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      
      <p style={{color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '10px'}}>
        친구들의 사진과 동영상을 보려면 가입하세요.
      </p>

      <button type="button" className={styles.loginBtn} style={{marginBottom: '10px'}}>
         Facebook으로 로그인
      </button>

      <div className={styles.separator}>
        <span>또는</span>
      </div>

      {/* Email Field */}
      <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!emailValue })}>
        <input 
          {...register('email')} 
          type="email" 
          className={styles.input} 
        />
        <label className={styles.floatingLabel}>이메일 주소</label>
      </div>
      {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}

      {/* Username Field */}
      <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!usernameValue })}>
        <input 
          {...register('username')} 
          type="text" 
          className={styles.input} 
        />
        <label className={styles.floatingLabel}>사용자 이름</label>
      </div>
      {errors.username && <p className={styles.errorMsg}>{errors.username.message}</p>}

      {/* Password Field */}
      <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!passwordValue })}>
        <input 
          {...register('password')} 
          type="password" 
          className={styles.input} 
        />
        <label className={styles.floatingLabel}>비밀번호</label>
      </div>
      {errors.password && <p className={styles.errorMsg}>{errors.password.message}</p>}

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '10px'}}>
        가입하면 KCL의 약관, 데이터 정책 및 쿠키 정책에 동의하게 됩니다.
      </div>

      <button type="submit" className={styles.loginBtn} disabled={loading} style={{marginTop: '16px'}}>
        {loading ? '가입 중...' : '가입하기'}
      </button>
    </form>
  );
}
