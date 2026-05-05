<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VerificationRequested extends Notification
{
    use Queueable;
    public $data;

    public function __construct($data) { $this->data = $data; }
    public function via(object $notifiable): array { return ['database']; }
    public function toArray(object $notifiable): array { return $this->data; }
}
