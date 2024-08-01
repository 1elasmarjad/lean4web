#/bin/bash

ELAN_HOME=$(cd $1 && lake env printenv ELAN_HOME)

(exec bwrap\
  --bind $1 /project \
  --bind $ELAN_HOME /elan \
  --bind /usr /usr \
  --dev /dev \
  --proc /proc \
  --symlink usr/lib /lib\
  --symlink usr/lib64 /lib64\
  --symlink usr/bin /bin\
  --symlink usr/sbin /sbin\
  --clearenv \
  --setenv PATH "/elan/bin:/bin" \
  --setenv ELAN_HOME "/elan" \
  --unshare-user \
  --unshare-pid  \
  --unshare-net  \
  --unshare-uts  \
  --unshare-cgroup \
  --die-with-parent \
  --chdir "/project/" \
  lake serve --
)
