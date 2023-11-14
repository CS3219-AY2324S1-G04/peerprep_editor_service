#!/usr/bin/env bash

### Constants ###
cr="ghcr.io/cs3219-ay2324s1-g04/"
export_dir="./docker_build"

################################################################################
#                                                                              #
#                  This marks the start of image information.                  #
#                                                                              #
#                        If you are adding a new image:                        #
#  1. Add a unique key in "image_keys" for your image.                         #
#  2. For each image specify the following variables:                          #
#     - images_KEY_name - Name of the image. (should be prepended with the     #
#       container registry ${cr})                                              #
#     - images_KEY_docker_file - Path to the dockerfile.                       #
#     - images_KEY_should_build - Should be 0. This value is set by CLI        #
#       arguments.                                                             #
#                                                                              #
################################################################################

# This list should contain a unique key for each image.
image_keys=(api)

# Editor service api image
images_api_name=${cr}peerprep_editor_service_api
images_api_docker_file="./dockerfiles/api.dockerfile"
images_api_should_build=0

################################################################################
#                                                                              #
#                   This marks the end of image information.                   #
#                                                                              #
################################################################################

# Instructions
image_keys_str=""
for k in ${image_keys[@]}; do
  if [[ $image_keys_str == "" ]]; then
    image_keys_str="\"${k}\""
  else
    image_keys_str="${image_keys_str}, or \"${k}\""
  fi
done

instructions="\n"\
"Usage: build_images.sh [-h] [-e] [-p] [-i IMAGE] [-t TAG]\n"\
"\n"\
"This script builds Docker images, exports them to \"./docker_build\", then pushes them to the container registry. The default configuration builds all images and does not export or push them to the container registry. Arguments can be specified to change the script behaviour.\n"\
"\n"\
"Arguments:\n"\
"-h\t\t     Prints the help message.\n"\
"-e\t\t     Enables exporting the images to the directory \"${export_dir}\".\n"\
"-p\t\t     Enables pushing to the container registry after building.\n"\
"-i IMAGE\t Specifies the image to build and push. Value can be ${image_keys_str}. This argument can be specified multiple times to include multiple images.\n"\
"-t TAG\t\t Tags the images built with \"TAG\"."

### Functions ###
build_image () {
  dockerfile=$1
  image_name=$2

  export_file="$export_dir/$2.tar"

  echo "Building $image_name ..."

  docker image build . --tag=$image_name --file $dockerfile

  if [[ $? -ne 0 ]]; then
    echo "Build failed."
    exit 1
  fi

  echo "Build successful."

  if [[ $should_export == 0 ]]; then
    return 0
  fi

  echo "Exporting image ..."

  mkdir -p $(dirname $export_file)
  docker image save --output=$export_file $image_name

  if [[ $? -ne 0 ]]; then
    echo "Export failed."
    exit 1
  fi

  echo "Exported image to $export_file"
}

push_image() {
  image_name=$1

  echo "Pushing $image_name to the container registry ..."

  docker image push $image_name

  if [[ $? -ne 0 ]]; then
    echo "Push failed."
    exit 1
  fi

  echo "Push successful."
}

### Parse CLI Arguments ###
should_export=0
should_push=0
image_tag=':latest'

while getopts hepi:t: flag
do
  case "${flag}" in
    h)
      echo -e $instructions
      exit 0
      ;;
    e)
      should_export=1
      ;;
    p)
      should_push=1
      ;;
    i)
      eval images_${OPTARG}_should_build=1
      ;;
    t)
      image_tag=":$OPTARG"
  esac
done

for k in ${image_keys[@]}; do
  image_name_var=images_${k}_name
  eval images_${k}_name=${!image_name_var}${image_tag}
done

should_build_all=1
for k in ${image_keys[@]}; do
  image_should_build_var=images_${k}_should_build
  if [[ ${!image_should_build_var} == 1 ]]; then
    should_build_all=0
  fi
done

if [[ ${should_build_all} == 1 ]]; then
  for k in ${image_keys[@]}; do
    eval images_${k}_should_build=1
  done
fi

### Transpile Typescript ###
echo "Transpiling Typescript ..."

npm install
npm run build

if [[ $? -ne 0 ]]; then
  echo "Transpile failed."
  exit 1
fi

echo "Transpile successful."

### Build Images ###
for k in ${image_keys[@]}; do
  image_name_var=images_${k}_name
  image_docker_file_var=images_${k}_docker_file
  image_should_build_var=images_${k}_should_build

  if [[ ${!image_should_build_var} == 1 ]]; then
    build_image ${!image_docker_file_var} ${!image_name_var}
  fi
done

### Push Images to the Container Registry ###
if [[ $should_push == 0 ]]; then
  exit 0
fi

for k in ${image_keys[@]}; do
  image_name_var=images_${k}_name
  image_docker_file_var=images_${k}_docker_file
  image_should_build_var=images_${k}_should_build

  if [[ ${!image_should_build_var} == 1 ]]; then
    push_image ${!image_name_var}
  fi
done
