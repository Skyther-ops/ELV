#!/usr/bin/env bash
set -e

echo "Downloading Android Command Line Tools..."
wget -q "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -O /tmp/cmdline-tools.zip

echo "Extracting..."
mkdir -p $HOME/android-sdk/cmdline-tools
unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-unzipped
mv /tmp/cmdline-tools-unzipped/cmdline-tools $HOME/android-sdk/cmdline-tools/latest

export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

echo "Accepting licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1

echo "Installing platform tools, platforms;android-34, build-tools;34.0.0..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null
echo "Android SDK setup complete!"
