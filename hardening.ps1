#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Interactive Windows 11 hardening script built from the "Comprehensive Windows 11
    Hardening Checklist" (CyberPatriot-style). Nothing that changes system state runs
    without your explicit Y/N approval first.
 
.DESCRIPTION
    Every step that MODIFIES the system (disabling an account, stopping a service,
    changing a policy, deleting a share, etc.) is wrapped in Confirm-Step: it prints
    exactly what it is about to run, waits for you to approve it, and logs whatever
    you decided. Nothing destructive runs in a batch unless you explicitly type "a"
    to approve the rest of that one phase.
 
    Purely informational / read-only commands (listing users, listing services,
    listing shares, etc.) run automatically and just print their output, since they
    can't break anything - you use that output to decide what to approve next.
 
    Hard safety rails are built in on top of the approval prompts:
      - A protected-account list (the signed-in user, DefaultAccount, WDAGUtilityAccount)
        that account actions will refuse to touch even if you say yes.
      - A protected-service list (WMI, Base Filtering Engine, Windows Firewall, RPC,
        Event Log, Group Policy Client) that the service-disable step will refuse to touch.
      - Nothing here ever touches a "CyberPatriot" folder, scoring engine, or scoring
        service - see the Phase 0 rules banner.
 
.NOTES
    Run this from an elevated PowerShell (Run as Administrator), in Windows PowerShell
    5.1 or PowerShell 7 on Windows 11. It does nothing on its own besides show menus
    until you start approving steps.
 
    BEFORE YOU RUN THIS:
      1. Read the competition/environment Readme in full. If it ever contradicts this
         script, the Readme wins - skip the step here.
      2. Finish any forensics questions first. Some steps below (deleting accounts,
         clearing exclusions, etc.) can destroy evidence you'd need for those.
      3. Take a VM snapshot / backup.
 
.PARAMETER Phase
    One or more phase numbers (0-10) to run. If omitted, you'll get a menu.
 
.EXAMPLE
    .\Windows11-Hardening-Checklist.ps1
    .\Windows11-Hardening-Checklist.ps1 -Phase 2,3,6
#>
 
[CmdletBinding()]
param(
    [int[]]$Phase
)
 
# ======================================================================================
#  CORE FRAMEWORK
# ======================================================================================
 
$ErrorActionPreference = 'Continue'
 
$LogDir = Join-Path $env:USERPROFILE 'Desktop\HardeningLog'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$Script:LogFile = Join-Path $LogDir ("ChangeLog_{0}.txt" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
"Hardening run started $(Get-Date)" | Out-File -FilePath $Script:LogFile -Encoding UTF8
 
# Never touch these accounts, no matter what gets typed in at a prompt.
$Script:ProtectedAccounts = @($env:USERNAME, 'DefaultAccount', 'WDAGUtilityAccount') | Sort-Object -Unique
 
# Never stop/disable these services, no matter what gets typed in at a prompt.
$Script:ProtectedServices = @('Winmgmt', 'BFE', 'MpsSvc', 'RpcSs', 'EventLog', 'gpsvc')
 
$Script:ApprovedCount = 0
$Script:SkippedCount  = 0
$Script:ErrorCount    = 0
 
function Write-Log {
    param([Parameter(Mandatory)][string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $Script:LogFile -Value $line
}
 
function Write-Banner {
    param(
        [Parameter(Mandatory)][string]$Text,
        [ConsoleColor]$Color = 'Cyan'
    )
    Write-Host ''
    Write-Host ('=' * 84) -ForegroundColor $Color
    Write-Host $Text -ForegroundColor $Color
    Write-Host ('=' * 84) -ForegroundColor $Color
}
 
function Start-PhaseBanner {
    param([int]$Number, [string]$Name)
    $Script:AutoApprovePhase = $false
    Write-Banner "PHASE $Number : $Name"
    Write-Log "=== BEGIN PHASE $Number : $Name ==="
}
 
function Confirm-Step {
    <#
        Gate for anything that changes system state. Shows what will run,
        waits for explicit approval, logs the outcome either way.
    #>
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][scriptblock]$Action,
        [string]$Risk = '',
        [string]$CommandPreview = ''
    )
 
    Write-Host ''
    Write-Host "-- $Title" -ForegroundColor Yellow
    if ($Risk) { Write-Host "   Risk: $Risk" -ForegroundColor DarkYellow }
    if ($CommandPreview) {
        Write-Host '   Will run:' -ForegroundColor DarkGray
        foreach ($ln in ($CommandPreview -split "`n")) { Write-Host "     $ln" -ForegroundColor DarkGray }
    }
 
    if ($Script:AutoApprovePhase) {
        $answer = 'y'
        Write-Host '   (auto-approved for this phase)' -ForegroundColor DarkGray
    } else {
        $answer = Read-Host '   Approve? [y]es / [n]o (default) / [a]pprove rest of this phase / [q]uit script'
        if ([string]::IsNullOrWhiteSpace($answer)) { $answer = 'n' }
    }
 
    switch ($answer.Trim().ToLower()) {
        'a' { $Script:AutoApprovePhase = $true; $answer = 'y' }
        'q' {
            Write-Log "QUIT by user during: $Title"
            Write-Banner "Stopped by user. Change log: $Script:LogFile" -Color Red
            exit
        }
    }
 
    if ($answer.Trim().ToLower() -eq 'y') {
        try {
            & $Action
            Write-Host '   Done.' -ForegroundColor Green
            Write-Log "APPLIED: $Title"
            $Script:ApprovedCount++
        } catch {
            Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
            Write-Log "ERROR during '$Title': $($_.Exception.Message)"
            $Script:ErrorCount++
        }
    } else {
        Write-Host '   Skipped.' -ForegroundColor DarkGray
        Write-Log "SKIPPED: $Title"
        $Script:SkippedCount++
    }
}
 
function Show-Info {
    <# Read-only audit command: runs automatically, output is for you to review. #>
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][scriptblock]$Action
    )
    Write-Host ''
    Write-Host "-- $Title (read-only, runs automatically)" -ForegroundColor Cyan
    try {
        $result = & $Action
        if ($null -ne $result) { $result | Format-Table -AutoSize -Wrap | Out-Host }
        Write-Log "VIEWED: $Title"
    } catch {
        Write-Host "   Could not run: $($_.Exception.Message)" -ForegroundColor Red
        Write-Log "VIEW ERROR '$Title': $($_.Exception.Message)"
    }
}
 
function Test-ProtectedAccount {
    param([Parameter(Mandatory)][string]$Name)
    if ($Script:ProtectedAccounts -contains $Name) {
        Write-Host "   BLOCKED: '$Name' is on the protected-account list (signed-in user / DefaultAccount / WDAGUtilityAccount). Refusing to touch it." -ForegroundColor Red
        Write-Log "BLOCKED protected account: $Name"
        return $true
    }
    return $false
}
 
function Test-ProtectedService {
    param([Parameter(Mandatory)][string]$Name)
    if ($Script:ProtectedServices -contains $Name) {
        Write-Host "   BLOCKED: '$Name' is on the protected-service list (core infrastructure). Refusing to touch it." -ForegroundColor Red
        Write-Log "BLOCKED protected service: $Name"
        return $true
    }
    return $false
}
 
function Get-NamesFromPrompt {
    param([Parameter(Mandatory)][string]$PromptText)
    $raw = Read-Host $PromptText
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
    return ($raw -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
}
 
# ======================================================================================
#  PHASE 0 - CRITICAL OPERATING RULES
# ======================================================================================
 
function Invoke-Phase0 {
    Start-PhaseBanner -Number 0 -Name 'Critical Operating Rules'
    Write-Host @'
 
  1. The Readme outranks everything. If this script and the Readme disagree, the
     Readme wins - skip the step here.
  2. Never touch the CyberPatriot / scoring folder, scoring scripts, or scoring
     engine services. This script does not know where those live on your image,
     so that responsibility is entirely on you when approving steps.
  3. No blind changes: no broad recursive icacls, no deleting unfamiliar system
     files, no disabling essential Windows services (this script hard-blocks a
     short list of those, see below, but that list is not exhaustive).
  4. Document everything. This script already logs every approved/skipped step to:
       {0}
     but if you make changes outside this script, log those yourself too.
 
  Protected accounts this script will refuse to disable/delete no matter what:
     {1}
  Protected services this script will refuse to stop/disable no matter what:
     {2}
'@ -f $Script:LogFile, ($Script:ProtectedAccounts -join ', '), ($Script:ProtectedServices -join ', ')
 
    $ack = Read-Host 'Type YES to confirm you have read the Readme and understand the rules above'
    if ($ack -ne 'YES') {
        Write-Host 'Not confirmed. Exiting so nothing runs by accident.' -ForegroundColor Red
        Write-Log 'Phase 0 acknowledgement NOT given - script exited.'
        exit
    }
    Write-Log 'Phase 0 acknowledgement given.'
}
 
# ======================================================================================
#  PHASE 1 - INITIAL TRIAGE & FORENSICS
# ======================================================================================
 
function Invoke-Phase1 {
    Start-PhaseBanner -Number 1 -Name 'Initial Triage & Forensics'
 
    Show-Info -Title 'Network connectivity (IP config)' -Action { Get-NetIPConfiguration }
 
    $notesPath = Join-Path $LogDir 'ReadmeNotes.txt'
    Write-Host "`nRecord the four critical lists from the Readme now (this just writes notes to a file, nothing is applied)." -ForegroundColor Cyan
    $authUsers   = Read-Host 'Authorized Users & Administrators (comma separated, or blank to skip)'
    $reqServices = Read-Host 'Required Services & Server Roles (comma separated, or blank to skip)'
    $reqApps     = Read-Host 'Required / Authorized Applications (comma separated, or blank to skip)'
    $reqShares   = Read-Host 'Required Network Shares & Remote Access (comma separated, or blank to skip)'
    @"
Readme notes recorded $(Get-Date)
Authorized Users & Administrators: $authUsers
Required Services & Server Roles: $reqServices
Required / Authorized Applications: $reqApps
Required Network Shares & Remote Access: $reqShares
"@ | Out-File -FilePath $notesPath -Encoding UTF8
    Write-Host "Saved to $notesPath" -ForegroundColor Green
    Write-Log "Readme notes saved to $notesPath"
 
    $forensicsDone = Read-Host "`nType YES once ALL forensics questions are answered (deleting accounts/clearing logs/removing malware before this destroys evidence)"
    if ($forensicsDone -ne 'YES') {
        Write-Host 'Forensics not confirmed complete. You can still continue, but the checklist says do this first.' -ForegroundColor Yellow
        Write-Log 'Forensics NOT confirmed complete by user.'
    } else {
        Write-Log 'Forensics confirmed complete by user.'
    }
 
    Confirm-Step -Title 'Create a System Restore point before making changes' `
        -Risk 'Low - this only creates a restore point, does not change settings.' `
        -CommandPreview 'Enable-ComputerRestore -Drive "C:\"; Checkpoint-Computer -Description "Pre-hardening" -RestorePointType MODIFY_SETTINGS' `
        -Action {
            Enable-ComputerRestore -Drive 'C:\' -ErrorAction SilentlyContinue
            Checkpoint-Computer -Description 'Pre-hardening' -RestorePointType MODIFY_SETTINGS
        }
}
 
# ======================================================================================
#  PHASE 2 - USER ACCOUNT & PRIVILEGE HARDENING
# ======================================================================================
 
function Invoke-Phase2 {
    Start-PhaseBanner -Number 2 -Name 'User Account & Privilege Hardening'
 
    Show-Info -Title 'All local users' -Action { Get-LocalUser | Select-Object Name, Enabled, PasswordExpires, Description }
    Show-Info -Title 'Administrators group members' -Action { Get-LocalGroupMember -Group 'Administrators' | Select-Object Name, PrincipalSource, ObjectClass }
 
    $secondaryGroups = @('Remote Desktop Users', 'Remote Management Users', 'Backup Operators', 'Power Users', 'Hyper-V Administrators', 'Event Log Readers')
    foreach ($g in $secondaryGroups) {
        Show-Info -Title "Members of '$g'" -Action {
            try { Get-LocalGroupMember -Group $g -ErrorAction Stop | Select-Object Name, PrincipalSource }
            catch { Write-Host "   (group '$g' not present on this system)" -ForegroundColor DarkGray }
        }.GetNewClosure()
    }
 
    Confirm-Step -Title 'Disable the Guest account' `
        -CommandPreview 'Disable-LocalUser -Name "Guest"' `
        -Action { Disable-LocalUser -Name 'Guest' -ErrorAction Stop }
 
    $builtinAdmin = Get-LocalUser | Where-Object { $_.SID -like '*-500' } | Select-Object -First 1
    if ($builtinAdmin) {
        Confirm-Step -Title "Disable built-in Administrator account ('$($builtinAdmin.Name)') - only if NOT the account you're signed in as, and not required by the Readme" `
            -Risk 'If this is the account you are currently using, disabling it can lock you out.' `
            -CommandPreview "Disable-LocalUser -Name `"$($builtinAdmin.Name)`"" `
            -Action {
                if (Test-ProtectedAccount -Name $builtinAdmin.Name) { return }
                Disable-LocalUser -Name $builtinAdmin.Name -ErrorAction Stop
            }
    }
 
    Write-Host "`nAccount audit - only run this after forensics is complete." -ForegroundColor Cyan
    $toDisable = Get-NamesFromPrompt 'Unauthorized accounts to DISABLE (comma separated, blank to skip)'
    foreach ($u in $toDisable) {
        Confirm-Step -Title "Disable local account '$u'" -CommandPreview "Disable-LocalUser -Name `"$u`"" -Action {
            if (Test-ProtectedAccount -Name $u) { return }
            Disable-LocalUser -Name $u -ErrorAction Stop
        }.GetNewClosure()
    }
 
    $toDelete = Get-NamesFromPrompt 'Unauthorized accounts to DELETE outright (comma separated, blank to skip - deleting is harder to undo than disabling)'
    foreach ($u in $toDelete) {
        Confirm-Step -Title "DELETE local account '$u'" -Risk 'Irreversible.' -CommandPreview "Remove-LocalUser -Name `"$u`"" -Action {
            if (Test-ProtectedAccount -Name $u) { return }
            Remove-LocalUser -Name $u -ErrorAction Stop
        }.GetNewClosure()
    }
 
    $toDemote = Get-NamesFromPrompt 'Accounts to DEMOTE out of Administrators (comma separated, blank to skip)'
    foreach ($u in $toDemote) {
        Confirm-Step -Title "Remove '$u' from Administrators" -CommandPreview "Remove-LocalGroupMember -Group `"Administrators`" -Member `"$u`"" -Action {
            if (Test-ProtectedAccount -Name $u) { return }
            Remove-LocalGroupMember -Group 'Administrators' -Member $u -ErrorAction Stop
        }.GetNewClosure()
    }
 
    foreach ($g in $secondaryGroups) {
        $members = Get-NamesFromPrompt "Members to remove from '$g' (comma separated, blank to skip)"
        foreach ($u in $members) {
            Confirm-Step -Title "Remove '$u' from '$g'" -CommandPreview "Remove-LocalGroupMember -Group `"$g`" -Member `"$u`"" -Action {
                if (Test-ProtectedAccount -Name $u) { return }
                Remove-LocalGroupMember -Group $g -Member $u -ErrorAction Stop
            }.GetNewClosure()
        }
    }
 
    Show-Info -Title 'Accounts with "password never expires" set' -Action {
        Get-LocalUser | Where-Object { $_.PasswordExpires -eq $null -and $_.Enabled } | Select-Object Name, PasswordExpires
    }
    $pwUsers = Get-NamesFromPrompt 'Standard user accounts to clear "password never expires" on (comma separated, blank to skip - do NOT include service/admin accounts that need it)'
    foreach ($u in $pwUsers) {
        Confirm-Step -Title "Clear PasswordNeverExpires on '$u'" -CommandPreview "Set-LocalUser -Name `"$u`" -PasswordNeverExpires `$false" -Action {
            Set-LocalUser -Name $u -PasswordNeverExpires $false -ErrorAction Stop
        }.GetNewClosure()
    }
 
    $pwSetUsers = Get-NamesFromPrompt 'Accounts to set a new password on right now (comma separated, blank to skip)'
    foreach ($u in $pwSetUsers) {
        $secure = Read-Host "New password for '$u'" -AsSecureString
        Confirm-Step -Title "Set new password for '$u'" -CommandPreview "Set-LocalUser -Name `"$u`" -Password (SecureString)" -Action {
            Set-LocalUser -Name $u -Password $secure -ErrorAction Stop
        }.GetNewClosure()
    }
 
    Write-Host "`nNOTE: the checklist explicitly says NOT to check 'must change password at next logon' on every user (it can cause lockouts). This script intentionally does not offer that as a bulk action." -ForegroundColor DarkYellow
 
    Confirm-Step -Title 'Disable AutoLogon and remove any saved AutoLogon password (Winlogon registry)' `
        -CommandPreview 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon -> AutoAdminLogon=0, remove DefaultPassword' `
        -Action {
            $path = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
            Set-ItemProperty -Path $path -Name 'AutoAdminLogon' -Value '0' -ErrorAction Stop
            Remove-ItemProperty -Path $path -Name 'DefaultPassword' -ErrorAction SilentlyContinue
        }
}
 
# ======================================================================================
#  PHASE 3 - LOCAL SECURITY POLICIES
# ======================================================================================
 
function Invoke-SeceditMerge {
    <# Merge a hashtable of [Section]-> "Key = Value" lines into the current security
       policy and apply it via secedit. Used for the Security Options / registry-backed
       settings that don't have a direct PowerShell cmdlet. #>
    param([Parameter(Mandatory)][string]$IniBody)
 
    $work = Join-Path $env:TEMP ("secpol_{0}.inf" -f (Get-Random))
    $db   = Join-Path $env:TEMP ("secedit_{0}.sdb" -f (Get-Random))
    $current = Join-Path $env:TEMP ("secpol_current_{0}.inf" -f (Get-Random))
 
    secedit /export /cfg $current | Out-Null
 
    $header = "[Unicode]`nUnicode=yes`n[Version]`nsignature=`"`$CHICAGO`$`"`nRevision=1`n"
    ($header + $IniBody) | Out-File -FilePath $work -Encoding Unicode
 
    secedit /configure /db $db /cfg $work /areas SECURITYPOLICY | Out-Host
 
    Remove-Item $work, $db, $current -ErrorAction SilentlyContinue
}
 
function Invoke-Phase3 {
    Start-PhaseBanner -Number 3 -Name 'Local Security Policies'
 
    Confirm-Step -Title 'Password policy (history 24, max age 60, min age 1, min length 14, lockout 5/30/30)' `
        -CommandPreview @'
net accounts /uniquepw:24
net accounts /maxpwage:60
net accounts /minpwage:1
net accounts /minpwlen:14
net accounts /lockoutthreshold:5
net accounts /lockoutduration:30
net accounts /lockoutwindow:30
'@ `
        -Action {
            net accounts /uniquepw:24        | Out-Host
            net accounts /maxpwage:60        | Out-Host
            net accounts /minpwage:1         | Out-Host
            net accounts /minpwlen:14        | Out-Host
            net accounts /lockoutthreshold:5 | Out-Host
            net accounts /lockoutduration:30 | Out-Host
            net accounts /lockoutwindow:30   | Out-Host
        }
 
    Confirm-Step -Title 'Password complexity ON, reversible encryption OFF (via secedit)' `
        -Risk 'Applies to the whole machine security policy database.' `
        -CommandPreview 'secedit merge: PasswordComplexity=1, ClearTextPassword=0' `
        -Action {
            Invoke-SeceditMerge -IniBody "[System Access]`nPasswordComplexity = 1`nClearTextPassword = 0`n"
        }
 
    Confirm-Step -Title 'Security Options: anonymous access & network authentication hardening' `
        -Risk 'Can break legacy tools that rely on NTLM/LM or anonymous SAM access. Restricts LAN Manager auth to NTLMv2 only.' `
        -CommandPreview @'
secedit / registry merge (Lsa hive):
  LimitBlankPasswordUse=1, RestrictAnonymous=1, RestrictAnonymousSAM=1,
  EveryoneIncludesAnonymous=0, NoLMHash=1, LmCompatibilityLevel=5
  LanmanServer/Workstation RequireSecuritySignature=1
'@ `
        -Action {
            $body = @'
[Registry Values]
MACHINE\System\CurrentControlSet\Control\Lsa\LimitBlankPasswordUse=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\RestrictAnonymous=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\RestrictAnonymousSAM=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\EveryoneIncludesAnonymous=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\NoLMHash=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\LmCompatibilityLevel=4,5
MACHINE\System\CurrentControlSet\Services\LanmanWorkstation\Parameters\RequireSecuritySignature=4,1
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\RequireSecuritySignature=4,1
'@
            Invoke-SeceditMerge -IniBody $body
        }
 
    Confirm-Step -Title 'Clear the "shares accessible anonymously" list' `
        -CommandPreview 'MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\NullSessionShares = (empty)' `
        -Action {
            Invoke-SeceditMerge -IniBody "[Registry Values]`nMACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\NullSessionShares=7,`n"
        }
 
    Confirm-Step -Title 'Interactive logon: hide last signed-in user, enforce Ctrl+Alt+Del, 15 min inactivity lock' `
        -CommandPreview @'
Policies\System: DontDisplayLastUserName=1, DisableCAD=0, InactivityTimeoutSecs=900
'@ `
        -Action {
            $body = @'
[Registry Values]
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\DontDisplayLastUserName=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\DisableCAD=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\InactivityTimeoutSecs=4,900
'@
            Invoke-SeceditMerge -IniBody $body
        }
 
    Confirm-Step -Title 'User Account Control (UAC) hardening' `
        -Risk 'Standard users will be prompted for admin credentials for elevation; admins get a consent prompt on the secure desktop.' `
        -CommandPreview 'EnableLUA=1, ConsentPromptBehaviorAdmin=2, ConsentPromptBehaviorUser=1, PromptOnSecureDesktop=1, FilterAdministratorToken=1, EnableInstallerDetection=1' `
        -Action {
            $body = @'
[Registry Values]
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableLUA=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ConsentPromptBehaviorAdmin=4,2
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ConsentPromptBehaviorUser=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\PromptOnSecureDesktop=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\FilterAdministratorToken=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableInstallerDetection=4,1
'@
            Invoke-SeceditMerge -IniBody $body
        }
 
    Confirm-Step -Title 'User Rights Assignment: tighten sensitive privileges' `
        -Risk 'Removes standard users from "Access this computer from the network" and "Allow log on through RDS" (leaves Administrators only). If your Readme requires RDP for specific standard users, do NOT approve this as-is - add them to the [Privilege Rights] block first.' `
        -CommandPreview @'
SeTcbPrivilege = (none)
SeCreateTokenPrivilege = (none)
SeNetworkLogonRight = Administrators only
SeDenyNetworkLogonRight = Guests
SeDenyInteractiveLogonRight = Guests
SeDenyRemoteInteractiveLogonRight = Guests
SeRemoteInteractiveLogonRight = Administrators only
'@ `
        -Action {
            $body = @'
[Privilege Rights]
SeTcbPrivilege =
SeCreateTokenPrivilege =
SeNetworkLogonRight = *S-1-5-32-544
SeDenyNetworkLogonRight = *S-1-5-32-546
SeDenyInteractiveLogonRight = *S-1-5-32-546
SeDenyRemoteInteractiveLogonRight = *S-1-5-32-546
SeRemoteInteractiveLogonRight = *S-1-5-32-544
'@
            Invoke-SeceditMerge -IniBody $body
        }
 
    Write-Host "`nSecurity policy changes were merged via secedit. Run 'secedit /export /cfg review.inf' afterward to double check what actually landed." -ForegroundColor DarkGray
}
 
# ======================================================================================
#  PHASE 4 - ADVANCED AUDIT POLICY
# ======================================================================================
 
function Invoke-Phase4 {
    Start-PhaseBanner -Number 4 -Name 'Advanced Audit Policy Configuration'
 
    Confirm-Step -Title 'Force audit policy subcategory settings to override category settings' `
        -CommandPreview 'MACHINE\System\CurrentControlSet\Control\Lsa\SCENoApplyLegacyAuditPolicy=1' `
        -Action { Invoke-SeceditMerge -IniBody "[Registry Values]`nMACHINE\System\CurrentControlSet\Control\Lsa\SCENoApplyLegacyAuditPolicy=4,1`n" }
 
    $subcats = @(
        'Credential Validation',
        'User Account Management', 'Security Group Management',
        'Logon', 'Logoff', 'Account Lockout', 'Special Logon',
        'Audit Policy Change', 'Authentication Policy Change',
        'Sensitive Privilege Use',
        'Security State Change', 'Security System Extension', 'System Integrity',
        'Process Creation'
    )
    Confirm-Step -Title 'Enable Success+Failure auditing for the key subcategories' `
        -CommandPreview ("auditpol /set /subcategory:`"<name>`" /success:enable /failure:enable  (for: " + ($subcats -join ', ') + ')') `
        -Action {
            foreach ($s in $subcats) {
                auditpol /set /subcategory:"$s" /success:enable /failure:enable | Out-Host
            }
        }
 
    Confirm-Step -Title 'Enable command-line logging in process creation events' `
        -CommandPreview 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit\ProcessCreationIncludeCmdLine_Enabled = 1' `
        -Action {
            $path = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit'
            if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
            New-ItemProperty -Path $path -Name 'ProcessCreationIncludeCmdLine_Enabled' -PropertyType DWord -Value 1 -Force | Out-Null
        }
 
    $sizeKB = Read-Host 'Security event log max size in KB (blank = leave current size, just fixes overwrite behavior; suggestion: 196608 = 192MB)'
    Confirm-Step -Title 'Set Security log to overwrite events as needed (and size, if given)' `
        -CommandPreview 'Limit-EventLog -LogName Security -OverflowAction OverwriteAsNeeded [-MaximumSize <KB>]' `
        -Action {
            if ([string]::IsNullOrWhiteSpace($sizeKB)) {
                Limit-EventLog -LogName Security -OverflowAction OverwriteAsNeeded
            } else {
                Limit-EventLog -LogName Security -OverflowAction OverwriteAsNeeded -MaximumSize ([int]$sizeKB)
            }
        }
}
 
# ======================================================================================
#  PHASE 5 - DEFENDER, SECURITY CENTER & UPDATES
# ======================================================================================
 
function Invoke-Phase5 {
    Start-PhaseBanner -Number 5 -Name 'Defender, Security Center & System Updates'
 
    Confirm-Step -Title 'Check for and install Windows Updates' `
        -Risk 'Can take a long time and may require a reboot; run this early.' `
        -CommandPreview 'UsoClient.exe ScanInstallWait  (falls back to opening Settings if unavailable)' `
        -Action {
            if (Get-Command UsoClient.exe -ErrorAction SilentlyContinue) {
                Start-Process -FilePath 'UsoClient.exe' -ArgumentList 'ScanInstallWait' -Wait
            } else {
                Start-Process 'ms-settings:windowsupdate'
                Write-Host '   Opened Settings > Windows Update - check for updates manually.' -ForegroundColor Yellow
            }
        }
 
    Confirm-Step -Title 'Turn OFF "allow downloads from other PCs" (Delivery Optimization)' `
        -CommandPreview 'Set-DODownloadMode 0' `
        -Action { Set-DODownloadMode 0 -ErrorAction Stop }
 
    Confirm-Step -Title 'Microsoft Defender: real-time + cloud-delivered protection ON, PUA blocking ON' `
        -CommandPreview 'Set-MpPreference -DisableRealtimeMonitoring $false -MAPSReporting Advanced -SubmitSamplesConsent SendSafeSamples -PUAProtection Enabled' `
        -Action {
            Set-MpPreference -DisableRealtimeMonitoring $false
            Set-MpPreference -MAPSReporting Advanced
            Set-MpPreference -SubmitSamplesConsent SendSafeSamples
            Set-MpPreference -PUAProtection Enabled
        }
 
    Write-Host "`nNOTE: Tamper Protection cannot be toggled from PowerShell by design (Microsoft blocks scripted changes to it). Enable it manually in Windows Security > Virus & threat protection settings, LAST, after everything else in this phase." -ForegroundColor DarkYellow
    Write-Log 'Reminder shown: Tamper Protection must be enabled manually.'
 
    Show-Info -Title 'Current Defender exclusions (look for anything broad like C:\)' -Action {
        Get-MpPreference | Select-Object ExclusionPath, ExclusionExtension, ExclusionProcess
    }
    $exPaths = Get-NamesFromPrompt 'Exclusion PATHS to remove (comma separated, blank to skip)'
    foreach ($p in $exPaths) {
        Confirm-Step -Title "Remove Defender exclusion path '$p'" -CommandPreview "Remove-MpPreference -ExclusionPath `"$p`"" -Action {
            Remove-MpPreference -ExclusionPath $p -ErrorAction Stop
        }.GetNewClosure()
    }
 
    Confirm-Step -Title 'Enable SmartScreen for apps/files and Microsoft Edge' `
        -CommandPreview 'Policies\System EnableSmartScreen=1; Policies\Microsoft Edge SmartScreenEnabled=1' `
        -Action {
            $p1 = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\System'
            if (-not (Test-Path $p1)) { New-Item -Path $p1 -Force | Out-Null }
            New-ItemProperty -Path $p1 -Name 'EnableSmartScreen' -PropertyType DWord -Value 1 -Force | Out-Null
 
            $p2 = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
            if (-not (Test-Path $p2)) { New-Item -Path $p2 -Force | Out-Null }
            New-ItemProperty -Path $p2 -Name 'SmartScreenEnabled' -PropertyType DWord -Value 1 -Force | Out-Null
        }
 
    Confirm-Step -Title 'Enable Core Isolation / Memory Integrity (requires reboot to take effect)' `
        -Risk 'Can be incompatible with some old/unsigned drivers; if the box relies on one, this can cause boot or device issues.' `
        -CommandPreview 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity Enabled=1' `
        -Action {
            $p = 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'
            if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
            New-ItemProperty -Path $p -Name 'Enabled' -PropertyType DWord -Value 1 -Force | Out-Null
        }
 
    Confirm-Step -Title 'Enable LSA Protection (blocks credential dumping from lsass.exe, requires reboot)' `
        -CommandPreview 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa RunAsPPL=1' `
        -Action {
            New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' -Name 'RunAsPPL' -PropertyType DWord -Value 1 -Force | Out-Null
        }
 
    Confirm-Step -Title 'Run a Microsoft Defender Quick Scan now' `
        -CommandPreview 'Start-MpScan -ScanType QuickScan' `
        -Action { Start-MpScan -ScanType QuickScan }
}
 
# ======================================================================================
#  PHASE 6 - FIREWALL & NETWORK PROTOCOL HARDENING
# ======================================================================================
 
function Invoke-Phase6 {
    Start-PhaseBanner -Number 6 -Name 'Firewall & Network Protocol Hardening'
 
    Confirm-Step -Title 'Firewall ON for all profiles, Inbound=Block / Outbound=Allow by default' `
        -Risk 'If the Readme requires specific inbound roles (IIS, printing, etc.), make sure the matching allow rule exists before/after this.' `
        -CommandPreview 'Set-NetFirewallProfile -All -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Allow' `
        -Action { Set-NetFirewallProfile -All -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Allow }
 
    Show-Info -Title 'Enabled inbound firewall rule groups' -Action {
        Get-NetFirewallRule -Direction Inbound -Enabled True |
            Select-Object -ExpandProperty DisplayGroup -Unique | Where-Object { $_ }
    }
    $defaultGroups = @('Remote Assistance', 'File and Printer Sharing', 'Network Discovery', 'Remote Registry')
    Write-Host "Commonly disabled groups on a hardened box: $($defaultGroups -join ', ')" -ForegroundColor DarkGray
    $groupsToDisable = Get-NamesFromPrompt 'Inbound rule GROUPS to disable (comma separated, blank to skip)'
    foreach ($g in $groupsToDisable) {
        Confirm-Step -Title "Disable inbound rule group '$g'" -CommandPreview "Disable-NetFirewallRule -DisplayGroup `"$g`"" -Action {
            Disable-NetFirewallRule -DisplayGroup $g -ErrorAction Stop
        }.GetNewClosure()
    }
 
    Show-Info -Title 'Listening ports and owning process IDs (review each PID with Get-Process)' -Action {
        Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess |
            Sort-Object LocalPort
    }
 
    Confirm-Step -Title 'Disable SMBv1' `
        -CommandPreview 'Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart' `
        -Action { Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart | Out-Host }
 
    Confirm-Step -Title 'Disable insecure SMB guest logons' `
        -CommandPreview 'Set-SmbClientConfiguration -EnableInsecureGuestLogons $false -Force' `
        -Action { Set-SmbClientConfiguration -EnableInsecureGuestLogons $false -Force }
 
    Confirm-Step -Title 'Disable LLMNR (multicast name resolution)' `
        -CommandPreview 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient EnableMulticast=0' `
        -Action {
            $p = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient'
            if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
            New-ItemProperty -Path $p -Name 'EnableMulticast' -PropertyType DWord -Value 0 -Force | Out-Null
        }
 
    Show-Info -Title 'Network adapters (for the NetBIOS step below)' -Action {
        Get-CimInstance Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True' | Select-Object Description, Index
    }
    Confirm-Step -Title 'Disable NetBIOS over TCP/IP on all active adapters' `
        -CommandPreview '(Get-CimInstance Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True").SetTcpipNetbios(2)' `
        -Action {
            $adapters = Get-CimInstance Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True'
            foreach ($a in $adapters) {
                Invoke-CimMethod -InputObject $a -MethodName SetTcpipNetbios -Arguments @{ TcpipNetbiosOptions = 2 } | Out-Null
            }
        }
 
    Show-Info -Title 'Hosts file contents (review for malicious redirects by hand)' -Action {
        Get-Content -Path "$env:WINDIR\System32\drivers\etc\hosts" -ErrorAction SilentlyContinue |
            Where-Object { $_ -and $_ -notmatch '^\s*#' }
    }
 
    Show-Info -Title 'Proxy configuration (should normally be disabled unless required)' -Action {
        Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue |
            Select-Object ProxyEnable, ProxyServer
    }
    Show-Info -Title 'DNS server configuration per adapter' -Action {
        Get-DnsClientServerAddress | Where-Object { $_.ServerAddresses } | Select-Object InterfaceAlias, ServerAddresses
    }
}
 
# ======================================================================================
#  PHASE 7 - NETWORK SHARES, SERVICES & OPTIONAL FEATURES
# ======================================================================================
 
function Invoke-Phase7 {
    Start-PhaseBanner -Number 7 -Name 'Network Shares, Services & Optional Features'
 
    Show-Info -Title 'Active SMB shares (do NOT remove C$, ADMIN$, IPC$ - default admin shares)' -Action {
        Get-SmbShare | Select-Object Name, Path, Description
    }
    $sharesToRemove = Get-NamesFromPrompt 'Custom/unauthorized share NAMES to remove (comma separated, blank to skip; never type C$, ADMIN$, or IPC$)'
    foreach ($s in $sharesToRemove) {
        Confirm-Step -Title "Remove share '$s'" -Risk 'Refusing this for C$/ADMIN$/IPC$ automatically.' -CommandPreview "Remove-SmbShare -Name `"$s`" -Force" -Action {
            if ($s -in @('C$', 'ADMIN$', 'IPC$')) {
                Write-Host '   BLOCKED: default administrative share, not removing.' -ForegroundColor Red
                return
            }
            Remove-SmbShare -Name $s -Force -ErrorAction Stop
        }.GetNewClosure()
    }
 
    $optionalFeatures = @(
        @{ Name = 'SMB1Protocol';                  Label = 'SMB 1.0/CIFS File Sharing Support' },
        @{ Name = 'TelnetClient';                   Label = 'Telnet Client' },
        @{ Name = 'TFTP';                            Label = 'TFTP Client' },
        @{ Name = 'SimpleTCP';                       Label = 'Simple TCP/IP Services' },
        @{ Name = 'MicrosoftWindowsPowerShellV2Root';Label = 'Windows PowerShell 2.0 (root)' },
        @{ Name = 'MicrosoftWindowsPowerShellV2';    Label = 'Windows PowerShell 2.0 (engine)' },
        @{ Name = 'IIS-WebServerRole';               Label = 'IIS Web Server Role' }
    )
    Write-Host "`nOptional Windows features from the checklist (skip any the Readme says are required):" -ForegroundColor Cyan
    foreach ($f in $optionalFeatures) {
        Confirm-Step -Title "Disable optional feature: $($f.Label)" `
            -CommandPreview "Disable-WindowsOptionalFeature -Online -FeatureName $($f.Name) -NoRestart" `
            -Action {
                try {
                    Disable-WindowsOptionalFeature -Online -FeatureName $f.Name -NoRestart -ErrorAction Stop | Out-Host
                } catch {
                    Write-Host "   (feature '$($f.Name)' not present on this system - nothing to do)" -ForegroundColor DarkGray
                }
            }.GetNewClosure()
    }
 
    $servicesToDisable = @('RemoteRegistry', 'TermService', 'RemoteAccess', 'SSDPSRV', 'upnphost', 'Spooler', 'TlntSvr', 'FTPSVC', 'MapsBroker', 'XblAuthManager', 'XblGameSave')
    Write-Host "`nServices from the checklist (skip any the Readme says are required, e.g. TermService if RDP is required, Spooler if this is a print server):" -ForegroundColor Cyan
    Write-Host "Hard-blocked no matter what: $($Script:ProtectedServices -join ', ')" -ForegroundColor DarkYellow
    foreach ($svc in $servicesToDisable) {
        Confirm-Step -Title "Stop and disable service: $svc" `
            -CommandPreview "Stop-Service $svc -Force; Set-Service $svc -StartupType Disabled" `
            -Action {
                if (Test-ProtectedService -Name $svc) { return }
                $exists = Get-Service -Name $svc -ErrorAction SilentlyContinue
                if (-not $exists) { Write-Host "   (service '$svc' not present on this system)" -ForegroundColor DarkGray; return }
                Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
                Set-Service -Name $svc -StartupType Disabled -ErrorAction Stop
            }.GetNewClosure()
    }
}
 
# ======================================================================================
#  PHASE 8 - SOFTWARE, PERSISTENCE & FILE INSPECTION
# ======================================================================================
 
function Invoke-Phase8 {
    Start-PhaseBanner -Number 8 -Name 'Software, Persistence & File Inspection'
 
    Show-Info -Title 'Installed applications (via winget/Get-Package where available)' -Action {
        Get-Package -ErrorAction SilentlyContinue | Select-Object Name, Version | Sort-Object Name
    }
    Write-Host 'Prohibited-tool categories from the checklist: hacking/recon tools (Wireshark, Nmap, Metasploit...), unauthorized remote admin (TeamViewer, AnyDesk, VNC, ngrok...), P2P/torrent clients, unapproved games/media (Steam, Spotify).' -ForegroundColor DarkGray
    $appsToRemove = Get-NamesFromPrompt 'Exact package/app NAMES to uninstall (comma separated, blank to skip)'
    foreach ($app in $appsToRemove) {
        Confirm-Step -Title "Uninstall '$app'" -CommandPreview "Get-Package -Name `"$app`" | Uninstall-Package -Force" -Action {
            $pkg = Get-Package -Name $app -ErrorAction SilentlyContinue
            if (-not $pkg) { Write-Host "   Could not find a package named '$app' - uninstall it manually from Settings > Apps." -ForegroundColor Yellow; return }
            $pkg | Uninstall-Package -Force -ErrorAction Stop
        }.GetNewClosure()
    }
 
    Show-Info -Title 'Scheduled tasks that run scripting engines or launch from Temp/AppData/Downloads' -Action {
        Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' } | ForEach-Object {
            $exec = ($_.Actions | Where-Object { $_.Execute } | Select-Object -First 1).Execute
            if ($exec -and ($exec -match 'powershell|cmd\.exe|wscript|cscript|\.ps1|\.bat|\.vbs|Temp\\|AppData\\|Downloads\\')) {
                [PSCustomObject]@{ TaskName = $_.TaskName; TaskPath = $_.TaskPath; Execute = $exec; State = $_.State }
            }
        }
    }
    $tasksToDisable = Get-NamesFromPrompt 'Suspicious task NAMES to disable (comma separated, blank to skip)'
    foreach ($t in $tasksToDisable) {
        Confirm-Step -Title "Disable scheduled task '$t'" -CommandPreview "Get-ScheduledTask -TaskName `"$t`" | Disable-ScheduledTask" -Action {
            Get-ScheduledTask -TaskName $t -ErrorAction Stop | Disable-ScheduledTask -ErrorAction Stop | Out-Null
        }.GetNewClosure()
    }
 
    Show-Info -Title 'Startup programs' -Action {
        Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User
    }
 
    Show-Info -Title 'Registry Run / RunOnce keys (HKLM + HKCU)' -Action {
        $paths = @(
            'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
            'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce',
            'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
            'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce'
        )
        foreach ($p in $paths) {
            if (Test-Path $p) {
                Get-ItemProperty -Path $p | Select-Object -Property * -ExcludeProperty PS* |
                    ForEach-Object {
                        $obj = $_
                        $obj.PSObject.Properties | ForEach-Object { [PSCustomObject]@{ Path = $p; Name = $_.Name; Value = $_.Value } }
                    }
            }
        }
    }
    $runKeyEntries = Get-NamesFromPrompt 'Run-key VALUE NAMES to remove, format Path|Name comma separated e.g. "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run|BadApp" (blank to skip)'
    foreach ($entry in $runKeyEntries) {
        $parts = $entry -split '\|'
        if ($parts.Count -ne 2) { Write-Host "Skipping malformed entry '$entry' - expected Path|Name" -ForegroundColor Yellow; continue }
        $rp = $parts[0].Trim(); $rn = $parts[1].Trim()
        Confirm-Step -Title "Remove registry value '$rn' from $rp" -CommandPreview "Remove-ItemProperty -Path `"$rp`" -Name `"$rn`"" -Action {
            Remove-ItemProperty -Path $rp -Name $rn -ErrorAction Stop
        }.GetNewClosure()
    }
 
    Confirm-Step -Title 'Run System File Checker (sfc /scannow) - repairs replaced system binaries' `
        -Risk 'Can take 10-20+ minutes.' `
        -CommandPreview 'sfc /scannow' `
        -Action { sfc /scannow | Out-Host }
 
    Show-Info -Title 'Accessibility backdoor check: compare sethc/utilman/osk/magnify/Narrator hashes to cmd.exe' -Action {
        $cmdHash = (Get-FileHash "$env:WINDIR\System32\cmd.exe" -ErrorAction SilentlyContinue).Hash
        $targets = 'sethc.exe', 'utilman.exe', 'osk.exe', 'magnify.exe', 'Narrator.exe'
        foreach ($t in $targets) {
            $path = Join-Path "$env:WINDIR\System32" $t
            if (Test-Path $path) {
                $h = (Get-FileHash $path).Hash
                [PSCustomObject]@{ File = $t; MatchesCmdExe = ($h -eq $cmdHash) }
            }
        }
    }
 
    Show-Info -Title 'Image File Execution Options: any Debugger keys hijacking a process' -Action {
        $ifeoPath = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options'
        if (Test-Path $ifeoPath) {
            Get-ChildItem $ifeoPath | ForEach-Object {
                $dbg = (Get-ItemProperty -Path $_.PSPath -Name 'Debugger' -ErrorAction SilentlyContinue).Debugger
                if ($dbg) { [PSCustomObject]@{ Target = $_.PSChildName; Debugger = $dbg } }
            }
        }
    }
 
    Write-Host "`nSearching C:\Users for prohibited media/scripts - this only lists results, nothing is deleted automatically. It can take a while." -ForegroundColor Cyan
    Confirm-Step -Title 'Search user profiles for unapproved media/archives/scripts' `
        -CommandPreview 'Get-ChildItem C:\Users -Recurse -Include *.mp3,*.mp4,*.avi,*.torrent,*.bat,*.ps1,*.exe -Force' `
        -Action {
            Get-ChildItem -Path 'C:\Users' -Recurse -Force -ErrorAction SilentlyContinue -Include *.mp3, *.mp4, *.avi, *.torrent, *.bat, *.ps1, *.exe |
                Select-Object FullName, Length, LastWriteTime |
                Out-Host
        }
 
    Show-Info -Title 'Alternate Data Streams under C:\Users\Public' -Action {
        Get-ChildItem -Path 'C:\Users\Public' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
            Get-Item -Path $_.FullName -Stream * -ErrorAction SilentlyContinue | Where-Object { $_.Stream -ne ':$DATA' }
        } | Select-Object FileName, Stream, Length
    }
}
 
# ======================================================================================
#  PHASE 9 - APPLICATION & LOCAL POLICY HARDENING
# ======================================================================================
 
function Invoke-Phase9 {
    Start-PhaseBanner -Number 9 -Name 'Application & Local Policy Hardening'
 
    Write-Host @'
  Manual reminders (not automated here - too environment-specific to script safely):
    - Update Edge/Chrome/Firefox to current versions.
    - Review each browser's extensions and remove anything unapproved
      (edge://extensions, chrome://extensions, about:addons).
    - Confirm SmartScreen/Safe Browsing is on in each browser.
    - Confirm pop-up blocking is on in each browser.
'@ -ForegroundColor DarkGray
    Write-Log 'Phase 9 manual browser reminders shown.'
 
    Confirm-Step -Title 'Office: disable all macros with notification + block macros from the internet (Word/Excel/PowerPoint, Office 16.0)' `
        -Risk 'Only covers the common "16.0" registry path (Office 2016/2019/2021/365). Older Office versions or per-app exceptions need manual Trust Center review.' `
        -CommandPreview 'HKCU:\Software\Microsoft\Office\16.0\<App>\Security VBAWarnings=2, BlockContentExecutionFromInternet=1' `
        -Action {
            foreach ($app in 'Word', 'Excel', 'PowerPoint') {
                $p = "HKCU:\Software\Microsoft\Office\16.0\$app\Security"
                if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
                New-ItemProperty -Path $p -Name 'VBAWarnings' -PropertyType DWord -Value 2 -Force | Out-Null
                New-ItemProperty -Path $p -Name 'BlockContentExecutionFromInternet' -PropertyType DWord -Value 1 -Force | Out-Null
            }
        }
 
    Confirm-Step -Title 'Turn off AutoPlay for all drives and disable AutoRun commands' `
        -CommandPreview 'Policies\Explorer NoDriveTypeAutoRun=255, NoAutorun=1 (HKLM + HKCU)' `
        -Action {
            foreach ($hive in 'HKLM:', 'HKCU:') {
                $p = "$hive\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
                if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
                New-ItemProperty -Path $p -Name 'NoDriveTypeAutoRun' -PropertyType DWord -Value 255 -Force | Out-Null
                New-ItemProperty -Path $p -Name 'NoAutorun' -PropertyType DWord -Value 1 -Force | Out-Null
            }
        }
 
    Confirm-Step -Title 'Disable Windows Script Host (blocks standalone .vbs/.js execution)' `
        -CommandPreview 'HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings Enabled=0' `
        -Action {
            $p = 'HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings'
            if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
            New-ItemProperty -Path $p -Name 'Enabled' -PropertyType DWord -Value 0 -Force | Out-Null
        }
}
 
# ======================================================================================
#  PHASE 10 - FINAL VERIFICATION & REBOOT TEST
# ======================================================================================
 
function Invoke-Phase10 {
    Start-PhaseBanner -Number 10 -Name 'Final Verification & Reboot Test'
 
    Show-Info -Title 'Final local user list' -Action { Get-LocalUser | Select-Object Name, Enabled }
    Show-Info -Title 'Final Administrators group' -Action { Get-LocalGroupMember -Group 'Administrators' | Select-Object Name }
    Show-Info -Title 'Services currently running (cross-check against your Readme required list)' -Action {
        Get-Service | Where-Object { $_.Status -eq 'Running' } | Select-Object Name, DisplayName | Sort-Object Name
    }
 
    Write-Host "`nManually re-check against the Readme now: required accounts active, required software present, required roles/services running." -ForegroundColor Cyan
    Write-Host 'Then refresh the Scoring Report shortcut on the desktop and confirm points registered / no penalties.' -ForegroundColor Cyan
 
    Confirm-Step -Title 'Reboot now to verify settings persist and required services auto-start cleanly' `
        -Risk 'This restarts the machine immediately once approved.' `
        -CommandPreview 'Restart-Computer -Force' `
        -Action { Restart-Computer -Force }
}
 
# ======================================================================================
#  MENU / DRIVER
# ======================================================================================
 
$AllPhases = [ordered]@{
    0  = @{ Name = 'Critical Operating Rules';                 Fn = 'Invoke-Phase0' }
    1  = @{ Name = 'Initial Triage & Forensics';                Fn = 'Invoke-Phase1' }
    2  = @{ Name = 'User Account & Privilege Hardening';        Fn = 'Invoke-Phase2' }
    3  = @{ Name = 'Local Security Policies';                   Fn = 'Invoke-Phase3' }
    4  = @{ Name = 'Advanced Audit Policy Configuration';       Fn = 'Invoke-Phase4' }
    5  = @{ Name = 'Defender, Security Center & Updates';       Fn = 'Invoke-Phase5' }
    6  = @{ Name = 'Firewall & Network Protocol Hardening';     Fn = 'Invoke-Phase6' }
    7  = @{ Name = 'Network Shares, Services & Optional Features'; Fn = 'Invoke-Phase7' }
    8  = @{ Name = 'Software, Persistence & File Inspection';   Fn = 'Invoke-Phase8' }
    9  = @{ Name = 'Application & Local Policy Hardening';      Fn = 'Invoke-Phase9' }
    10 = @{ Name = 'Final Verification & Reboot Test';          Fn = 'Invoke-Phase10' }
}
 
function Show-Menu {
    Write-Banner 'Windows 11 Hardening Checklist - interactive, approve-as-you-go' 'Magenta'
    foreach ($k in $AllPhases.Keys) {
        Write-Host ("  {0,2} - {1}" -f $k, $AllPhases[$k].Name)
    }
    Write-Host ''
    $sel = Read-Host 'Enter phase numbers to run (comma separated), or press Enter to run ALL phases in order'
    if ([string]::IsNullOrWhiteSpace($sel)) {
        return $AllPhases.Keys
    }
    return ($sel -split ',') | ForEach-Object { [int]($_.Trim()) } | Where-Object { $AllPhases.Contains($_) }
}
 
$phasesToRun = if ($Phase -and $Phase.Count -gt 0) { $Phase } else { Show-Menu }
 
foreach ($p in $phasesToRun) {
    if (-not $AllPhases.Contains($p)) { continue }
    & $AllPhases[$p].Fn
}
 
Write-Banner "Run complete.  Approved: $Script:ApprovedCount   Skipped: $Script:SkippedCount   Errors: $Script:ErrorCount" 'Green'
Write-Host "Full change log: $Script:LogFile" -ForegroundColor Green
Write-Log "=== RUN COMPLETE. Approved=$Script:ApprovedCount Skipped=$Script:SkippedCount Errors=$Script:ErrorCount ==="
 
