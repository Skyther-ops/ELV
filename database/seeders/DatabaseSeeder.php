<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Supervisor Example',
                'role' => 'supervisor',
                'password' => bcrypt('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test Supervisor',
                'role' => 'supervisor',
                'password' => bcrypt('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'member@example.com'],
            [
                'name' => 'Test Member',
                'role' => 'member',
                'password' => bcrypt('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'business_member@example.com'],
            [
                'name' => 'Business Member',
                'role' => 'businesses',
                'password' => bcrypt('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'business_admin@example.com'],
            [
                'name' => 'Business Admin',
                'role' => 'business_admin',
                'password' => bcrypt('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'business_higher_admin@example.com'],
            [
                'name' => 'Business Higher Admin',
                'role' => 'business_higher_admin',
                'password' => bcrypt('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'director@example.com'],
            [
                'name' => 'Director Example',
                'role' => 'superadmin',
                'password' => bcrypt('password123'),
            ]
        );
    }
}