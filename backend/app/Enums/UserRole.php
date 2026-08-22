<?php

namespace App\Enums;

enum UserRole: string
{
    case Normal = 'normal';
    case Skilled = 'skilled';
    case Admin = 'admin';
}
